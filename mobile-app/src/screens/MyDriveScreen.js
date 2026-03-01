import React ,{ useCallback, useEffect, useState } from "react";
import { Alert, ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable, TextInput , Modal } from "react-native";
import { getFiles, createFolder } from "../services/api";

export default function MyDriveScreen() {
  const [parentId, setParentId] = useState(null);
  const [stack, setStack] = useState([]); // breadcrumb
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  
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
      <Pressable
        onPress={() => (isFolder ? enterFolder(item) : null)}
        style={{ paddingVertical: 12, paddingHorizontal: 14 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 18 }}>{isFolder ? "📁" : "📄"}</Text>
          <Text style={{ fontSize: 16 }} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </Pressable>
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
    </View>
  );
}