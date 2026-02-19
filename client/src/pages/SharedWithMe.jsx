import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { listFiles, removeSharedAccess } from "../services/filesService";

export default function SharedWithMe({ onReady }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingFile, setViewingFile] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listFiles("?shared=true");
      setItems(data);
    } catch (e) {
      setError(e.message || "Failed to load shared files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (onReady) onReady({ refresh });
  }, []);

  // only show files that are shared with the user and not trashed
  const visibleItems = useMemo(() => {
    if (loading || error) return [];
    return items.filter((it) => it.trashed !== true);
  }, [items, loading, error]);

  const isEmpty = !loading && !error && visibleItems.length === 0;

  const handleAction = async (action, file) => {
    if (action === "open") {
      setViewingFile(file);
    } 
    
    else if (action === "delete") {
      if (window.confirm(`Remove this item from your shared list?`)) {
        try {
          await removeSharedAccess(file.id); 
          await refresh();
        } catch (e) {
          alert("Failed to remove item");
        }
      }
    }

    else if (action === "download") {
      window.open(`/api/files/${file.id}/download`);
    }
  };

  const sharedItems = useMemo(() => {
    return visibleItems.map(item => ({
      ...item,
      allowedActions: ["open", "delete", "download"] 
    }));
  }, [visibleItems]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
      
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Shared with me</h1>
      </header>

      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
        hideNew={true} 
      />

      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
      {error && <div style={{ marginTop: 20, color: "tomato" }}>{error}</div>}
      
      {isEmpty && (
        <div style={{ 
            marginTop: 40, opacity: 0.6, textAlign: 'center', fontSize: '1.1rem',
            border: '2px dashed var(--border-color)', padding: '40px', borderRadius: '20px'
        }}>
            No one has shared anything with you yet.
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {viewMode === "grid" ? (
            <FilesGrid items={visibleItems} onAction={handleAction} isSharedView={true} /> 
          ) : (
            <FilesList items={visibleItems} onAction={handleAction} isSharedView={true} />
          )}
        </div>
      )}

      {viewingFile && (
        <FileViewerModel 
            file={viewingFile} 
            onClose={() => setViewingFile(null)} 
            onSave={() => {
                setViewingFile(null);
                refresh();
            }}
        />
      )}
    </div>
  );
}