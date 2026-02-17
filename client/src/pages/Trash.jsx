import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { listFiles } from "../services/filesService";
import { restoreFile, hardDeleteFile } from "../services/filesService"; 

export default function Trash({ onReady }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingFile, setViewingFile] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listFiles();
      setItems(data);
    } catch (e) {
      setError(e.message || "Failed to load trash");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (onReady) onReady({ refresh });
  }, []);

  // only trashed items should be visible in trash page
  const visibleItems = useMemo(() => {
    if (loading || error) return [];
    return items.filter((it) => it.trashed === true);
  }, [items, loading, error]);

  const isEmpty = !loading && !error && visibleItems.length === 0;

  const handleAction = async (action, file) => {
    if (action === "restore") {
      try {
        await restoreFile(file.id); // function to restore file from trash
        await refresh();
      } catch (e) {
        alert("Failed to restore file");
      }
    } 
    else if (action === "deleteForever") {
      if (window.confirm(`Permanently delete ${file.name}? This cannot be undone.`)) {
        try {
          await hardDeleteFile(file.id); // final delete function
          await refresh();
        } catch (e) {
          alert("Failed to delete file");
        }
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
      
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Trash</h1>
      </header>

      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
      />

      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
      {error && <div style={{ marginTop: 20, color: "tomato" }}>{error}</div>}
      
      {isEmpty && (
        <div style={{ 
            marginTop: 40, opacity: 0.6, textAlign: 'center', fontSize: '1.1rem',
            border: '2px dashed var(--border-color)', padding: '40px', borderRadius: '20px'
        }}>
            Trash is empty.
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {viewMode === "grid" ? (
            <FilesGrid items={visibleItems} onAction={handleAction} isTrash={true} /> 
          ) : (
            <FilesList items={visibleItems} onAction={handleAction} isTrash={true} />
          )}
        </div>
      )}
    </div>
  );
}