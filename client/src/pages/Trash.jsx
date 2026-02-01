import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import { hardDeleteFile } from "../services/filesService";

export default function TrashPage() {
  const [trashFiles, setTrashFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadTrash() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiClient.get("/api/files?trashed=true");
      setTrashFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load trash");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  async function handleRestore(fileId) {
    setErr("");
    try {
      await apiClient.patch(`/api/files/${fileId}/trash`, { trashed: false });
      setTrashFiles((prev) => prev.filter((f) => f.id !== fileId));
      window.dispatchEvent(new Event("files-changed"));
    } catch (e) {
      setErr(e.message || "Restore failed");
    }
  }

  
  async function handleDeleteForever(fileId) {
    const ok = window.confirm("Delete forever? This cannot be undone.");
    if (!ok) return;
  
    setErr("");
    try {
      await hardDeleteFile(fileId);
      setTrashFiles((prev) => prev.filter((f) => f.id !== fileId));
      await loadTrash();
      window.dispatchEvent(new Event("files-changed"));
    } catch (e) {
      setErr(e.message || "Delete forever failed");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Trash</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={loadTrash} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, color: "red" }}>{err}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : trashFiles.length === 0 ? (
        <p>No deleted files 🎉</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {trashFiles.map((f) => (
            <li
              key={f.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>{f.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {f.type} • deletedAt: {f.deletedAt || "?"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>id: {f.id}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleRestore(f.id)}>Restore</button>

                <button
                  onClick={() => handleDeleteForever(f.id)}
                  style={{ opacity: 0.6 }}
                >
                  Delete Forever
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}