import React, { useCallback, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { getFiles, restoreItem, deletePermanently } from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";

export default function TrashScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getFiles(null, { trashed: true }); 
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("TRASH ERR:", e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";

    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14, opacity: 0.6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{isFolder ? "📁" : "📄"}</Text>
            <Text style={{ fontSize: 16 }} numberOfLines={1}>{item.name}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            setSelectedItem(item);
            setActionOpen(true);
          }}
          style={{ paddingHorizontal: 14, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 20 }}>⋯</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ padding: 10, backgroundColor: '#fff3cd', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#856404' }}>Items in Trash will be shown here.</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id || it._id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#f1f3f4" }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<View style={{ padding: 16 }}><Text style={{ opacity: 0.7 }}>Trash is empty</Text></View>}
      />

      <FileActionsSheet 
        visible={actionOpen} 
        item={selectedItem} 
        onClose={() => { setActionOpen(false); setSelectedItem(null); }} 
        
        onRestore={async () => {
          try {
            const id = selectedItem?.id || selectedItem?._id;
            setActionOpen(false);
            await restoreItem(id);
            Alert.alert("Success", "File restored to My Drive");
            await load();
          } catch (e) {
            Alert.alert("Error", "Failed to restore file. Check server routes.");
          }
        }}

        onDeletePermanent={() => {
          const id = selectedItem?.id || selectedItem?._id;
          Alert.alert(
            "Delete Permanently", 
            `This action cannot be undone. Delete "${selectedItem?.name}" forever?`, 
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Delete Forever", 
                style: "destructive", 
                onPress: async () => {
                  try {
                    setActionOpen(false);
                    await deletePermanently(id);
                    await load();
                  } catch (e) {
                    Alert.alert("Error", "Failed to delete permanently");
                  }
                } 
              }
            ]
          );
        }}

        onRename={() => {}} 
        onDelete={() => {}}
        onShare={() => {}}
        onToggleStar={() => {}}
        onOpen={() => {}}
        onRemoveAccess={() => {}}
      />
    </View>
  );
}