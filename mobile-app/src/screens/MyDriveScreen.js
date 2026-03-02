import React, { useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable, TextInput, Modal, TouchableOpacity, StyleSheet } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker'; 
import { getFiles, createFolder, renameItem, deleteItem, toggleStar, shareItem, uploadFile, getFileById } from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function MyDriveScreen() {
  const [parentId, setParentId] = useState(null);
  const [stack, setStack] = useState([]); // breadcrumb
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
  
  const [fabMenuOpen, setFabMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getFiles(null);
      const all = Array.isArray(data) ? data : [];
      const getParent = (x) => x.parentId ?? x.parent ?? null;
      const filtered = parentId ? all.filter((x) => getParent(x) === parentId) : all.filter((x) => getParent(x) == null);
      setItems(filtered);
    } catch (e) {
      console.log("FILES ERR:", e?.response?.status, e?.response?.data || e?.message);
      setError("Failed to load files");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const enterFolder = (folder) => {
    const fid = folder.id || folder._id;
    setStack((prev) => [...prev, { id: fid, name: folder.name }]);
    setParentId(fid);
  };

  const goBack = () => {
    setStack((prev) => {
      const next = prev.slice(0, -1);
      const newParentId = next.length ? next[next.length - 1].id : null;
      setParentId(newParentId);
      return next;
    });
  };

  const handleCreateFolderPress = () => {
    setFabMenuOpen(false); 
    setModalOpen(true); 
  };

const handleUploadFile = async () => {
    setFabMenuOpen(false); 
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*', 
      });

      if (result.canceled) return;

      const file = result.assets[0];

      await uploadFile(file, parentId);
      Alert.alert("Success", "File uploaded successfully!");
      await load();
      
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert("Error", "Failed to upload file");
    }
  };

  const handleTakePhoto = async () => {
    setFabMenuOpen(false); 
    
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'You need to allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8, 
      });

      if (!result.canceled) {
        const file = result.assets[0];

        const photoFile = {
          uri: file.uri,
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg'
        };

        await uploadFile(photoFile, parentId);
        Alert.alert("Success", "Photo uploaded successfully!");
        await load();

      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Alert.alert("Error", "Failed to upload photo");
    }
  };

  const handleOpenFile = async (fileItem) => {
    try {
      Alert.alert("Downloading...", `Opening ${fileItem.name}`);
      
      const fileId = fileItem.id || fileItem._id;
      
      const fullFile = await getFileById(fileId);
      
      if (!fullFile.content) {
        Alert.alert("Error", "File is empty or corrupted on the server.");
        return;
      }

      const safeName = fileItem.name.replace(/\s+/g, '_'); 
      const fileUri = `${FileSystem.documentDirectory}${safeName}`;

      await FileSystem.writeAsStringAsync(fileUri, fullFile.content, {
        encoding: 'base64',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: `View ${fileItem.name}`,
        });
      } else {
        Alert.alert("Error", "Sharing/Viewing is not available on this device");
      }

    } catch (e) {
      console.error("Error opening file:", e);
      Alert.alert("Error", "Failed to open the file.");
    }
  };

  // -------------------------

  const title = stack.length ? `My Drive / ${stack.map(s => s.name).join(" / ")}` : "My Drive";

  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";

    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => (isFolder ? enterFolder(item) : handleOpenFile(item))}
          style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 14 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 18 }}>{isFolder ? "📁" : "📄"}</Text>
            <Text style={{ fontSize: 16 }} numberOfLines={1}>
              {item.name}
            </Text>
            {item.starred ? <Text style={{ marginLeft: 6 }}>⭐</Text> : null}
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            setSelectedItem(item);
            setActionOpen(true);
          }}
          style={{ paddingHorizontal: 14, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 18 }}>⋮</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ padding: 14, borderBottomWidth: 1, borderColor: "#eee" }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{title}</Text>

        {stack.length > 0 && (
          <Pressable onPress={goBack} style={{ marginTop: 8 }}>
            <Text style={{ color: "#1a73e8" }}>← Back</Text>
          </Pressable>
        )}
        
        {error ? <Text style={{ color: "crimson", marginTop: 8 }}>{error}</Text> : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id || it._id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#f1f3f4" }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ opacity: 0.7 }}>No files</Text>
          </View>
        }
      />


      <TouchableOpacity style={styles.fab} onPress={() => setFabMenuOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {fabMenuOpen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
          <Pressable style={styles.modalOverlay} onPress={() => setFabMenuOpen(false)}>
            <View style={styles.bottomMenu}>
              <Text style={styles.menuTitle}>Create New</Text>
              
              <View style={styles.menuOptionsContainer}>
                <TouchableOpacity style={styles.menuOption} onPress={handleCreateFolderPress}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.menuIcon}>📁</Text>
                  </View>
                  <Text style={styles.menuText}>Folder</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuOption} onPress={handleUploadFile}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.menuIcon}>⬆️</Text>
                  </View>
                  <Text style={styles.menuText}>Upload</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuOption} onPress={handleTakePhoto}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.menuIcon}>📷</Text>
                  </View>
                  <Text style={styles.menuText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* MODAL NEW FOLDER */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>New Folder</Text>
            <TextInput value={folderName} onChangeText={setFolderName} placeholder="Folder name" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => { setModalOpen(false); setFolderName(""); }}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { const name = folderName.trim(); if (!name) return Alert.alert("Error", "Please enter folder name"); try { await createFolder(name, parentId); setModalOpen(false); setFolderName(""); await load(); } catch (e) { console.log("CREATE ERR:", e?.response?.status, e?.response?.data || e?.message); Alert.alert("Error", "Failed to create folder"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Create</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <FileActionsSheet visible={actionOpen} item={selectedItem} onClose={() => { setActionOpen(false); setSelectedItem(null); }} onRename={() => { setActionOpen(false); setNewName(selectedItem?.name || ""); setRenameOpen(true); }} onDelete={() => { const id = selectedItem?.id || selectedItem?._id; const name = selectedItem?.name || "this item"; Alert.alert("Delete", `Are you sure you want to delete "${name}"?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { setActionOpen(false); await deleteItem(id); await load(); } catch (e) { console.log("DELETE ERR:", e?.response?.status, e?.response?.data || e?.message); Alert.alert("Error", "Failed to delete"); } } }]); }} onShare={() => { setActionOpen(false); setTimeout(() => { setShareWith(""); setShareOpen(true); }, 200); }} onToggleStar={async () => { try { const id = selectedItem?.id || selectedItem?._id; const next = !selectedItem?.starred; setActionOpen(false); await toggleStar(id, next); await load(); Alert.alert("Success", selectedItem?.starred ? "Removed from starred" : "⭐ Added to starred"); } catch (e) { Alert.alert("Error", "Failed to toggle star"); } }} />
      
      <Modal visible={renameOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Rename</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="New name" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }} />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setRenameOpen(false)}><Text style={{ color: "gray" }}>Cancel</Text></Pressable>
              <Pressable onPress={async () => { const name = newName.trim(); if (!name) return Alert.alert("Error", "Please enter a name"); try { const id = selectedItem?.id || selectedItem?._id; await renameItem(id, name); setRenameOpen(false); await load(); } catch (e) { Alert.alert("Error", "Failed to rename"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Save</Text></Pressable>
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
              <Pressable onPress={async () => { const target = shareWith.trim(); if (!target) return Alert.alert("Error", "Please enter username/email"); try { const id = selectedItem?.id || selectedItem?._id; await shareItem(id, target); setShareOpen(false); setShareWith(""); Alert.alert("Success", `🔗 File shared successfully`); await load(); } catch (e) { Alert.alert("Error", "Failed to share"); } }}><Text style={{ color: "#1a73e8", fontWeight: "600" }}>Share</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a73e8', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, 
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  menuOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  menuOption: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuText: {
    fontSize: 14,
    color: '#444',
  },
});