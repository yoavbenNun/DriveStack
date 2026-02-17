import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { listFiles, moveToTrash } from "../services/filesService";
import { toggleStar } from "../services/StarredService";

export default function Starred({ onReady }) {
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
      setError(e.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (onReady) onReady({ refresh });
  }, []);

  // only starred and not trashed visible in this page
  const visibleItems = useMemo(() => {
    if (loading || error) return [];
    return items.filter((it) => it.starred && !it.trashed);
  }, [items, loading, error]);

  const isEmpty = !loading && !error && visibleItems.length === 0;

  const handleAction = async (action, file) => {
    if (action === "open") {
      setViewingFile(file);
    } 
    else if (action === "star") {
      try {
        await toggleStar(file.id, file.starred);
        await refresh(); 
      } catch (e) {
        alert(e.message || "Failed to update starred");
      }
    }
    else if (action === "delete") {
      if (window.confirm(`Move ${file.name} to trash?`)) {
        try {
          await moveToTrash(file.id);
          await refresh();
        } catch (e) {
          alert(e.message || "Failed to move to trash");
        }
      }
    }
    else if (action === "download") {
      window.open(`/api/files/${file.id}/download`);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
      
      <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Starred</h1>
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
            No starred files yet.
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {viewMode === "grid" ? (
            <FilesGrid items={visibleItems} onAction={handleAction} /> 
          ) : (
            <FilesList items={visibleItems} onAction={handleAction} />
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