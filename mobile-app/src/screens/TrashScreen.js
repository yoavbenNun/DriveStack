import React, { useCallback, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { getFiles, restoreItem, deletePermanently } from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";
import TopBar from "../components/TopBar"; 
import { MaterialIcons } from '@expo/vector-icons'; 

export default function TrashScreen({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [query, setQuery] = useState('');
  
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

  const dataToRender = query.trim() 
    ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";

    return (
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16, opacity: 0.7 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 16 }}>
          <MaterialIcons name={isFolder ? "folder" : "insert-drive-file"} size={28} color="#5f6368" />

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, color: '#1f1f1f', fontWeight: '400', marginBottom: 2, textDecorationLine: 'line-through' }} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="delete" size={12} color="#d93025" />
              <Text style={{ fontSize: 13, color: '#d93025' }}>Deleted</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => {
            setSelectedItem(item);
            setActionOpen(true);
          }}
          style={{ padding: 12 }}
        >
          <MaterialIcons name="more-horiz" size={24} color="#5f6368" />
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      
      <TopBar query={query} setQuery={setQuery} onLogout={onLogout} />

      <View style={{ flex: 1, backgroundColor: 'white' }}>
        

        <FlatList
          data={dataToRender}
          keyExtractor={(it) => String(it.id || it._id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#f1f3f4" }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ opacity: 0.7, textAlign: 'center', marginTop: 20 }}>
                {query.trim() ? "No results found" : "Trash is empty"}
              </Text>
            </View>
          }
        />
      </View>

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