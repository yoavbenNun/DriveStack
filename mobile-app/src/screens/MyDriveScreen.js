import React, { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable, TextInput, Modal, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker'; 
import { getFiles, createFolder, renameItem, deleteItem, toggleStar, shareItem, uploadFile, getFileById ,searchFiles} from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";
import TopBar from "../components/TopBar"; 
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

export default function MyDriveScreen({ onLogout }) {
  const [parentId, setParentId] = useState(null);
  const [stack, setStack] = useState([]); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareWith, setShareWith] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState({ type: null, content: null, name: '' });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getFiles(null);
      const all = Array.isArray(data) ? data : [];
      const getParent = (x) => x.parentId ?? x.parent ?? null;
      const notTrashed = all.filter(x => x.trashed !== true);
      const filtered = parentId ? notTrashed.filter((x) => getParent(x) === parentId) : notTrashed.filter((x) => getParent(x) == null);
      setItems(filtered);
    } catch (e) {
      setError("Failed to load files");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const enterFolder = (folder) => {
    const fid = folder.id || folder._id;
    setStack((prev) => [...prev, { id: fid, name: folder.name }]);
    setParentId(fid);
  };

  useEffect(() => {
    if (!query.trim()) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    const handler = setTimeout(async () => {
      try { const data = await searchFiles(query); setResults(data); } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const goBack = () => {
    setStack((prev) => {
      const next = prev.slice(0, -1);
      const newParentId = next.length ? next[next.length - 1].id : null;
      setParentId(newParentId);
      return next;
    });
  };

  const handleCreateFolderPress = () => { setFabMenuOpen(false); setModalOpen(true); };

  const handleUploadFile = async () => {
    setFabMenuOpen(false); 
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
      if (result.canceled) return;
      await uploadFile(result.assets[0], parentId);
      Alert.alert("Success", "File uploaded successfully!");
      await load();
    } catch (err) { Alert.alert("Error", "Failed to upload file"); }
  };

  const handleTakePhoto = async () => {
    setFabMenuOpen(false); 
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) return Alert.alert('Permission required', 'You need to allow access to your camera.');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) {
        const photoFile = { uri: result.assets[0].uri, name: `photo_${Date.now()}.jpg`, mimeType: 'image/jpeg' };
        await uploadFile(photoFile, parentId);
        Alert.alert("Success", "Photo uploaded successfully!");
        await load();
      }
    } catch (err) { Alert.alert("Error", "Failed to upload photo"); }
  };

 const handleOpenFile = async (fileItem) => {
    try {
      const fileId = fileItem._id || fileItem.id;
      if (!fileId) return Alert.alert("Error", "Missing file ID");

      console.log("Loading...", `Opening ${fileItem.name}`);
      const fullFile = await getFileById(fileId);
      
      if (!fullFile || !fullFile.content) {
        return Alert.alert("Error", "The server returned no content.");
      }

      let cleanContent = fullFile.content.trim();
      
      if (cleanContent.toLowerCase().startsWith("404")) {
        return Alert.alert("Error", "File not found on storage server.");
      }
      
      if (cleanContent.toLowerCase().startsWith("200 ok")) {
        cleanContent = cleanContent.substring(6).trim();
      }

      const mime = (fullFile.mime || "").toLowerCase();
      const name = (fileItem.name || "").toLowerCase();
      
      const isImage = mime.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
      const isText = mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.js') || name.endsWith('.json');

      if (isImage) {
        const imageUri = cleanContent.startsWith('data:') 
          ? cleanContent 
          : `data:${mime || 'image/jpeg'};base64,${cleanContent}`;
        
        setPreviewData({ type: 'image', content: imageUri, name: fileItem.name });
        setPreviewVisible(true);
      } 
      else if (isText) {
        try {
          const tempUri = `${FileSystem.documentDirectory}temp.txt`;
          await FileSystem.writeAsStringAsync(tempUri, cleanContent, { encoding: 'base64' });
          const textContent = await FileSystem.readAsStringAsync(tempUri, { encoding: 'utf8' });
          setPreviewData({ type: 'text', content: textContent, name: fileItem.name });
          setPreviewVisible(true);
        } catch (e) {
          setPreviewData({ type: 'text', content: cleanContent, name: fileItem.name });
          setPreviewVisible(true);
        }
      } 
      else {
        const safeName = fileItem.name.replace(/\s+/g, '_');
        const fileUri = `${FileSystem.documentDirectory}${safeName}`;
        
        await FileSystem.writeAsStringAsync(fileUri, cleanContent, { encoding: 'base64' });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, { 
            mimeType: mime, 
            dialogTitle: `Open ${fileItem.name}`
          });
        } else {
          Alert.alert("Error", "No app available to open this file type.");
        }
      }
    } catch (e) {
      console.error("Open Error:", e.message);
      Alert.alert("Error", "Failed to open file.");
    }
  };

  const dataToRender = query.trim() ? results : items;
  
  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : 'Recently';

    return (
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 16 }}>
        <Pressable onPress={() => (isFolder ? enterFolder(item) : handleOpenFile(item))} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 16 }}>
          <MaterialIcons name={isFolder ? "folder" : "insert-drive-file"} size={28} color={isFolder ? "#5f6368" : "#4285f4"} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, color: '#1f1f1f', fontWeight: '400', marginBottom: 2 }} numberOfLines={1}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {item.shared && <MaterialIcons name="people-alt" size={12} color="#5f6368" />}
              <Text style={{ fontSize: 13, color: '#5f6368' }}>{dateStr}</Text>
            </View>
          </View>
          {item.starred ? <MaterialIcons name="star" size={18} color="#f4b400" /> : null}
        </Pressable>
        <Pressable onPress={() => { setSelectedItem(item); setActionOpen(true); }} style={{ padding: 12 }}>
          <MaterialIcons name="more-horiz" size={24} color="#5f6368" />
        </Pressable>
      </View>
    );
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#1a73e8" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <TopBar query={query} setQuery={setQuery} onLogout={onLogout} />

      <View style={{ flex: 1, backgroundColor: 'white' }}>
        {stack.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
            <Pressable onPress={goBack} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f1f3f4', borderRadius: 8 }}>
              <MaterialIcons name="arrow-back" size={18} color="#1f1f1f" />
              <Text style={{ marginLeft: 6, color: "#1f1f1f", fontWeight: '500' }}>Back</Text>
            </Pressable>
            <Text style={{ marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#1f1f1f' }} numberOfLines={1}>{stack[stack.length - 1].name}</Text>
          </View>
        )}

        <FlatList
          data={dataToRender}
          keyExtractor={(it) => String(it.id || it._id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<View style={{ padding: 16 }}><Text style={{ opacity: 0.7, textAlign: 'center', marginTop: 20 }}>{query.trim() ? "No results found" : "No files"}</Text></View>}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setFabMenuOpen(true)} activeOpacity={0.8}>
        <MaterialIcons name="add" size={32} color="#1a73e8" />
      </TouchableOpacity>

      {/* FAB MENU */}
      {fabMenuOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <Pressable style={styles.modalOverlay} onPress={() => setFabMenuOpen(false)}>
            <View style={styles.bottomMenu}>
              <Text style={styles.menuTitle}>Create New</Text>
              <View style={styles.menuOptionsContainer}>
                <TouchableOpacity style={styles.menuOption} onPress={handleCreateFolderPress}><View style={styles.iconCircle}><MaterialIcons name="create-new-folder" size={24} color="#5f6368" /></View><Text style={styles.menuText}>Folder</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuOption} onPress={handleUploadFile}><View style={styles.iconCircle}><MaterialIcons name="file-upload" size={24} color="#5f6368" /></View><Text style={styles.menuText}>Upload</Text></TouchableOpacity>
                <TouchableOpacity style={styles.menuOption} onPress={handleTakePhoto}><View style={styles.iconCircle}><MaterialIcons name="photo-camera" size={24} color="#5f6368" /></View><Text style={styles.menuText}>Camera</Text></TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* RENAME MODAL */}
      <Modal visible={renameOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Rename</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="New name" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setRenameOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { try { await renameItem(selectedItem?.id || selectedItem?._id, newName.trim()); setRenameOpen(false); await load(); } catch (e) { Alert.alert("Error", "Failed"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SHARE MODAL */}
      <Modal visible={shareOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Share</Text>
            <TextInput value={shareWith} onChangeText={setShareWith} placeholder="Email" autoCapitalize="none" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setShareOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { try { await shareItem(selectedItem?.id || selectedItem?._id, shareWith.trim()); setShareOpen(false); Alert.alert("Success", "Shared"); } catch (e) { Alert.alert("Error", "Failed"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Share</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* FILE ACTIONS */}
      <FileActionsSheet visible={actionOpen} item={selectedItem} onClose={() => { setActionOpen(false); setSelectedItem(null); }} onRename={() => { setActionOpen(false); setNewName(selectedItem?.name || ""); setRenameOpen(true); }} onDelete={() => { Alert.alert("Delete", "Delete?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: async () => { await deleteItem(selectedItem?.id || selectedItem?._id); await load(); setActionOpen(false); } }]); }} onShare={() => { setActionOpen(false); setShareOpen(true); }} onToggleStar={async () => { await toggleStar(selectedItem?.id || selectedItem?._id, !selectedItem?.starred); await load(); setActionOpen(false); }} />

      {/* NEW FOLDER MODAL */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>New Folder</Text>
            <TextInput value={folderName} onChangeText={setFolderName} placeholder="Folder name" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setModalOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { try { await createFolder(folderName.trim(), parentId); setModalOpen(false); await load(); } catch (e) { Alert.alert("Error", "Failed"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Create</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal visible={previewVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: 'white', marginTop: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }} numberOfLines={1}>{previewData.name}</Text>
            <Pressable onPress={() => setPreviewVisible(false)}><Text style={{ color: '#1a73e8', fontSize: 16, fontWeight: '600', padding: 4 }}>Done</Text></Pressable>
          </View>
          <View style={{ flex: 1, backgroundColor: previewData.type === 'image' ? '#000' : '#fff' }}>
            {previewData.type === 'image' && <Image source={{ uri: previewData.content }} style={{ flex: 1, width: '100%', height: '100%', resizeMode: 'contain' }} />}
            {previewData.type === 'text' && <ScrollView style={{ flex: 1, padding: 16 }}><Text style={{ fontSize: 16, color: '#333' }}>{previewData.content}</Text></ScrollView>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, bottom: 20, width: 64, height: 64, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomMenu: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  menuTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20, color: '#333' },
  menuOptionsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  menuOption: { alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f3f4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuText: { fontSize: 14, color: '#444' },
});