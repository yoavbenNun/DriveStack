import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { ChevronRight, ArrowLeft } from "lucide-react"; 
import { listFiles ,moveToTrash, renameFile} from "../services/filesService";
import { toggleStar } from "../services/StarredService";
import { shareFile } from "../services/filesService";

export default function MyDrive({onReady, onFolderChange, searchQuery, searchResults, isSearching,}) {
    const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await listFiles();
      console.log("first item:", data?.[0]);
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

  // update parent folder change
  useEffect(() => {
    if (onFolderChange) {
      onFolderChange(currentFolderId);
    }
  }, [currentFolderId, onFolderChange]);

  // Perform filtering based on current folder
  const isSearchMode = Boolean(searchQuery?.trim());
  const visibleItems = useMemo(() => {
  if (loading || error) return [];
  if (isSearchMode) {
    return (searchResults || []).filter((it) => !it.trashed);
  }
  const cur = currentFolderId ?? null;
  
  return items.filter((it) => (it.parentId ?? null) === cur && !it.trashed);
  }, [items, currentFolderId, loading, error, isSearchMode, searchResults]);

  const isEmpty = !loading && !error && visibleItems.length === 0;

  // action handler
  const handleAction = async (action, file) => {
    if (action === "open") {
      if (file.type === "folder") {
        setCurrentFolderId(file.id);
      } else {
        setViewingFile(file);
      }
    }

    else if (action === "rename") {
      const newName = window.prompt("Enter new name:", file.name);
      if (newName && newName !== file.name) {
        try {
          await renameFile(file.id, newName);
          await refresh(); 
        }   catch (e) {
        alert("Failed to rename file");
      }
    }
  }

    else if (action === "star") {
      try {
        await toggleStar(file.id, file.starred);
        await refresh(); 
      } catch (e) {
        alert(e.message || "Failed to update starred");
      }
    }

    else if (action === "share") {
      const targetEmail = window.prompt("Enter email to share with:");
      if (targetEmail) {
        try {
          await shareFile(file.id, targetEmail);
          alert("File shared successfully");
        } catch (e) {
          alert(e.message || "Failed to share file");
        }
      }
    }

    else if (action === "delete") {
      if (window.confirm(`Move ${file.name} to trash?`)) {
        try {
          await moveToTrash(file.id);  // PATCH /trash
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


  // Parent folder navigation
  const goBack = () => {
    if (!currentFolderId) return;
    const currentFolder = items.find(i => i.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId ?? null);
  };

  // format current folder name
  const currentFolderName = currentFolderId 
    ? items.find(i => i.id === currentFolderId)?.name 
    : "My Drive";

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
      
      {/* --- Header & Navigation --- */}
      <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        {currentFolderId && (
          <button 
            onClick={goBack}
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', 
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={20} color="white" />
          </button>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
             {currentFolderId ? (
                <>
                  <span style={{ opacity: 0.5, fontSize: '1.5rem' }}>My Drive</span>
                  <ChevronRight size={24} opacity={0.5} />
                  {currentFolderName}
                </>
             ) : (
               "My Drive"
             )}
           </h1>
        </div>
      </header>

      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
      />
      {isSearchMode && isSearching && (<div style={{ marginTop: 20, opacity: 0.8 }}>Searching...</div>)}
      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
      {error && <div style={{ marginTop: 20, color: "tomato" }}>{error}</div>}
      
      {isEmpty && (
        <div style={{ 
            marginTop: 40, opacity: 0.6, textAlign: 'center', fontSize: '1.1rem',
            border: '2px dashed var(--border-color)', padding: '40px', borderRadius: '20px'
        }}>
            This folder is empty.
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