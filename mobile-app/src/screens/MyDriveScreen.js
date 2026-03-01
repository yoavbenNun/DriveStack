import React ,{ useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable, TextInput , Modal } from "react-native";
import { getFiles, createFolder, renameItem, deleteItem, toggleStar , shareItem} from "../services/api";
import FileActionsSheet from "../components/FileActionsSheet";

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
  
  const load = useCallback(async () => {
    setError("");
    try {
        const data = await getFiles(null); 
        console.log("FILES RES:", data);
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

  const title = stack.length ? `My Drive / ${stack.map(s => s.name).join(" / ")}` : "My Drive";

  const renderItem = ({ item }) => {
    const isFolder = item.type === "folder";

    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => (isFolder ? enterFolder(item) : null)}
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
        <Pressable
            onPress={() => setModalOpen(true)} style={{ marginTop: 10 }}>
            <Text style={{ color: "#1a73e8" }}>＋ New Folder </Text>
        </Pressable>
        {error ? <Text style={{ color: "crimson", marginTop: 8 }}>{error}</Text> : null}
        </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id || it._id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#f1f3f4" }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ opacity: 0.7 }}>No files</Text>
          </View>
        }
      />
      {/* MODAL NEW FOLDER */}
        <Modal visible={modalOpen} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
            <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "600" }}>New Folder</Text>

              <TextInput
                value={folderName}
                onChangeText={setFolderName}
                placeholder="Folder name"
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }}
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
                <Pressable onPress={() => { setModalOpen(false); setFolderName(""); }}>
                  <Text style={{ color: "gray" }}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    const name = folderName.trim();
                    if (!name) return Alert.alert("Error", "Please enter folder name");

                    try {
                      await createFolder(name, parentId);
                      setModalOpen(false);
                      setFolderName("");
                      await load();
                    } catch (e) {
                      console.log("CREATE ERR:", e?.response?.status, e?.response?.data || e?.message);
                      Alert.alert("Error", "Failed to create folder");
                    }
                  }}
                >
                  <Text style={{ color: "#1a73e8", fontWeight: "600" }}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <FileActionsSheet
          visible={actionOpen}
          item={selectedItem}
          onClose={() => {setActionOpen(false); setSelectedItem(null); }}
          onRename={() => {
            setActionOpen(false);
            setNewName(selectedItem?.name || "");
            setRenameOpen(true);
          }}
          onDelete={() => {
            const id = selectedItem?.id || selectedItem?._id;
            const name = selectedItem?.name || "this item";

            Alert.alert(
              "Delete",
              `Are you sure you want to delete "${name}"?`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setActionOpen(false);
                      await deleteItem(id);
                      await load();
                    } catch (e) {
                      console.log("DELETE ERR:", e?.response?.status, e?.response?.data || e?.message);
                      Alert.alert("Error", "Failed to delete");
                    }
                  },
                },
              ]
            );
          }}
          onShare={() => {
            setActionOpen(false);
            setTimeout(() => {
              setShareWith("");
              setShareOpen(true);
            }, 200);
          }}
          onToggleStar={async () => {
            try {
              const id = selectedItem?.id || selectedItem?._id;
              const next = !selectedItem?.starred; 
              setActionOpen(false);
              await toggleStar(id, next);
              await load();
              Alert.alert(
                "Success",
                selectedItem?.starred ? "Removed from starred" : "⭐ Added to starred"
              );
            } catch (e) {
              console.log("STAR ERR:", e?.response?.status, e?.response?.data || e?.message);
              console.log("STAR URL:", `/files/${selectedItem?.id || selectedItem?._id}`);
              console.log("STAR DATA SENT:", { starred: !selectedItem?.starred });
              Alert.alert("Error", "Failed to toggle star");
            }
          }}
        />
        <Modal visible={renameOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Rename</Text>

            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New name"
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setRenameOpen(false)}>
                <Text style={{ color: "gray" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const name = newName.trim();
                  if (!name) return Alert.alert("Error", "Please enter a name");

                  try {
                    const id = selectedItem?.id || selectedItem?._id;
                    await renameItem(id, name);
                    setRenameOpen(false);
                    await load();
                  } catch (e) {
                    console.log("RENAME URL:", `/files/${selectedItem?.id || selectedItem?._id}`);
                    console.log("RENAME STATUS:", e?.response?.status);
                    console.log("RENAME DATA:", e?.response?.data);
                    console.log("RENAME MSG:", e?.message);
                    Alert.alert("Error", "Failed to rename");
                  }
                  }
                }
              >
                <Text style={{ color: "#1a73e8", fontWeight: "600" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={shareOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "85%", backgroundColor: "white", borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Share</Text>

            <TextInput
              value={shareWith}
              onChangeText={setShareWith}
              placeholder="Username / Email"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 12 }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <Pressable onPress={() => setShareOpen(false)}>
                <Text style={{ color: "gray" }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const target = shareWith.trim();
                  if (!target) return Alert.alert("Error", "Please enter username/email");

                  try {
                    const id = selectedItem?.id || selectedItem?._id;
                    await shareItem(id, target);
                    setShareOpen(false);
                    setShareWith("");
                    Alert.alert("Success", `🔗 File shared successfully with ${target}`);
                    await load();
                  } catch (e) {
                    console.log("SHARE ERR:", e?.response?.status, e?.response?.data || e?.message);
                    Alert.alert("Error", "Failed to share");
                  }
                }}
              >
                <Text style={{ color: "#1a73e8", fontWeight: "600" }}>Share</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}