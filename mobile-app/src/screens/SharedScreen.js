import React, { useCallback, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable, TextInput, Modal, Image, ScrollView } from "react-native";
import { useFocusEffect } from '@react-navigation/native'; 
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getFiles, renameItem, deleteItem, toggleStar, shareItem, getFileById, removeSharedAccess } from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";
import TopBar from "../components/TopBar"; 
import { MaterialIcons } from '@expo/vector-icons'; 

export default function SharedScreen({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [query, setQuery] = useState('');
  
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareWith, setShareWith] = useState("");

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ type: null, content: null, name: '' });

  const load = useCallback(async () => {
    try {
      const data = await getFiles(null, { shared: true }); 
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("FILES ERR:", e?.message);
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

  const handleOpenFile = async (fileItem) => {
    try {
      Alert.alert("Loading...", `Opening ${fileItem.name}`);
      const fileId = fileItem.id || fileItem._id;
      const fullFile = await getFileById(fileId);
      
      if (!fullFile.content) {
        Alert.alert("Error", "File is empty or corrupted on the server.");
        return;
      }

      const mime = String(fullFile.mime || '').toLowerCase();
      const name = String(fileItem.name || '').toLowerCase();
      
      const isImage = mime.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
      const isText = mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.js') || name.endsWith('.json') || name.endsWith('.html');

      if (isImage) {
        const imageUri = `data:${fullFile.mime || 'image/jpeg'};base64,${fullFile.content}`;
        setPreviewData({ type: 'image', content: imageUri, name: fileItem.name });
        setPreviewVisible(true);
      } else if (isText) {
        const safeName = fileItem.name.replace(/\s+/g, '_'); 
        const fileUri = `${FileSystem.documentDirectory}${safeName}`;
        await FileSystem.writeAsStringAsync(fileUri, fullFile.content, { encoding: 'base64' });
        const textContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });
        
        setPreviewData({ type: 'text', content: textContent, name: fileItem.name });
        setPreviewVisible(true);
      } else {
        const safeName = fileItem.name.replace(/\s+/g, '_'); 
        const fileUri = `${FileSystem.documentDirectory}${safeName}`;
        await FileSystem.writeAsStringAsync(fileUri, fullFile.content, { encoding: 'base64' });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, { dialogTitle: `View ${fileItem.name}` });
        } else {
          Alert.alert("Error", "Viewing is not available on this device");
        }
      }
    } catch (e) {
      console.error("Error opening file:", e);
      Alert.alert("Error", "Failed to open the file.");
    }
  };

  const dataToRender = query.trim() 
    ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : 'Shared with you';

    return (
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16 }}>
        <Pressable
          onPress={() => (isFolder ? Alert.alert("Notice", "Please go to My Drive to browse inside folders.") : handleOpenFile(item))}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 16 }}
        >
          <MaterialIcons name={isFolder ? "folder" : "insert-drive-file"} size={28} color={isFolder ? "#5f6368" : "#4285f4"} />

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, color: '#1f1f1f', fontWeight: '400', marginBottom: 2 }} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="people-alt" size={12} color="#5f6368" />
              <Text style={{ fontSize: 13, color: '#5f6368' }}>{dateStr}</Text>
            </View>
          </View>

          {item.starred ? <MaterialIcons name="star" size={18} color="#f4b400" /> : null}
        </Pressable>

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
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={{ padding: 16 }}>
              <Text style={{ opacity: 0.7, textAlign: 'center', marginTop: 20 }}>
                {query.trim() ? "No results found" : "No shared files"}
              </Text>
            </View>
          }
        />
      </View>

      <FileActionsSheet 
        visible={actionOpen} 
        item={selectedItem} 
        onClose={() => { setActionOpen(false); setSelectedItem(null); }} 
        onOpen={() => { setActionOpen(false); handleOpenFile(selectedItem); }}
        onRemoveAccess={() => {
            const id = selectedItem?.id || selectedItem?._id;
            Alert.alert(
                "Remove Access", 
                `Are you sure you want to remove your access to "${selectedItem?.name}"?`, 
                [
                { text: "Cancel", style: "cancel" }, { 
                    text: "Remove", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            setActionOpen(false);
                            await removeSharedAccess(id); 
                            await load(); 
                            } catch (e) {
                            Alert.alert("Error", "Failed to remove access");
                        }
                    } 
                }]
            );
        }}
        onRename={() => {}} 
        onDelete={() => {}} 
        onShare={() => { setActionOpen(false); setTimeout(() => { setShareWith(""); setShareOpen(true); }, 200); }} 
        onToggleStar={() => {}}
      />

      <Modal visible={previewVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: 'white', marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }} numberOfLines={1}>{previewData.name}</Text>
            <Pressable onPress={() => setPreviewVisible(false)}><Text style={{ color: '#1a73e8', fontSize: 16, fontWeight: '600', padding: 4 }}>Done</Text></Pressable>
          </View>
          <View style={{ flex: 1, backgroundColor: previewData.type === 'image' ? '#000' : '#fff' }}>
            {previewData.type === 'image' && <Image source={{ uri: previewData.content }} style={{ flex: 1, width: '100%', height: '100%', resizeMode: 'contain' }} />}
            {previewData.type === 'text' && <ScrollView style={{ flex: 1, padding: 16 }}><Text style={{ fontSize: 16, color: '#333', textAlign: 'left' }}>{previewData.content}</Text></ScrollView>}
          </View>
        </View>
      </Modal>

      <Modal visible={renameOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Rename</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="New name" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setRenameOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { 
                const name = newName.trim(); 
                if (!name) return Alert.alert("Error", "Please enter a name"); 
                try { await renameItem(selectedItem?.id || selectedItem?._id, name); setRenameOpen(false); await load(); } 
                catch (e) { Alert.alert("Error", "Failed to rename"); } 
              }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={shareOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Share</Text>
            <TextInput value={shareWith} onChangeText={setShareWith} placeholder="Username / Email" autoCapitalize="none" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setShareOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { 
                const target = shareWith.trim(); 
                if (!target) return Alert.alert("Error", "Please enter username/email"); 
                try { await shareItem(selectedItem?.id || selectedItem?._id, target); setShareOpen(false); setShareWith(""); Alert.alert("Success", `🔗 File shared successfully`); } 
                catch (e) { Alert.alert("Error", "Failed to share"); } 
              }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Share</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}