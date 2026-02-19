import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { listFiles ,moveToTrash, renameFile} from "../services/filesService";
import { toggleStar } from "../services/StarredService";
import { shareFile } from "../services/filesService";

export default function Recent({ onReady }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingFile, setViewingFile] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      // sort by updatedAt desc to get recent files first (server-side sorting)
      const data = await listFiles();
      
      const sorted = [...data].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      
      setItems(sorted);
    } catch (e) {
      setError(e.message || "Failed to load recent files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    if (onReady) onReady({ refresh });
  }, []);

  // For Recent, we show all non-trashed files sorted by recent activity, regardless of folder
  const visibleItems = useMemo(() => {
    if (loading || error) return [];
    return items.filter((it) => it.trashed !== true).slice(0, 20); 
  }, [items, loading, error]);

  const handleAction = async (action, file) => {
    switch (action) {
      case "open":
        setViewingFile(file);
        break;
      
      case "rename":
        const newName = window.prompt("Enter new name:", file.name);
        if (newName && newName !== file.name) {
          try {
            await renameFile(file.id, newName); 
            await refresh();
          } catch (e) {
            alert("Failed to rename file");
          }
        }
        break;

      case "star":
        try {
          await toggleStar(file.id, file.starred); 
          await refresh();
        } catch (e) {
          alert("Failed to update starred");
        }
        break;

      case "share":
        const targetEmail = window.prompt("Enter email to share with:");
              if (targetEmail) {
                try {
                  await shareFile(file.id, targetEmail);
                  alert("File shared successfully");
                } catch (e) {
                  alert(e.message || "Failed to share file");
                }
              }
        break;

      case "delete":
        if (window.confirm(`Move "${file.name}" to trash?`)) {
          try {
            await moveToTrash(file.id); 
            await refresh();
          } catch (e) {
            alert("Failed to move to trash");
          }
        }
        break;

      case "download":
        window.open(`/api/files/${file.id}/download`);
        break;

      default:
        console.log("Action not recognized:", action);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
      
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Recent</h1>
      </header>

      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
        hideNew={true}
      />

      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
      {error && <div style={{ marginTop: 20, color: "tomato" }}>{error}</div>}
      
      {!loading && !error && visibleItems.length === 0 && (
        <div style={{ 
            marginTop: 40, opacity: 0.6, textAlign: 'center', fontSize: '1.1rem',
            border: '2px dashed var(--border-color)', padding: '40px', borderRadius: '20px'
        }}>
            No recent activity found.
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