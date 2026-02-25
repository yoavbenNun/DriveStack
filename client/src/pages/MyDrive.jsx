import React, { useEffect, useState, useMemo } from "react";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModel from "../components/FileViewerModel";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { listFiles, moveToTrash, renameFile, shareFile } from "../services/filesService";
import { toggleStar } from "../services/StarredService";

export default function MyDrive({
  onReady,
  onFolderChange,
  searchQuery,
  searchResults,
  isSearching,
}) {
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
      setItems(data);
    } catch (e) {
      setError(e?.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    onReady?.({ refresh });
  }, []);

  useEffect(() => {
    onFolderChange?.(currentFolderId);
  }, [currentFolderId, onFolderChange]);

  const isSearchMode = Boolean(searchQuery?.trim());

  const visibleItems = useMemo(() => {
    if (isSearchMode) {
      return (searchResults || []).filter((it) => !it.trashed);
    }
    if (loading || error) return [];
    const cur = currentFolderId ?? null;
    return items.filter((it) => (it.parentId ?? null) === cur && !it.trashed);
  }, [isSearchMode, searchResults, items, currentFolderId, loading, error]);

  const showEmpty =
    !error &&
    !loading &&
    !isSearching &&
    visibleItems.length === 0 &&
    !isSearchMode;

  const showNoResults =
    !error &&
    !loading && 
    isSearchMode &&
    !isSearching &&
    visibleItems.length === 0;

  const handleAction = async (action, file) => {
    if (action === "open") {
      if (file.type === "folder") setCurrentFolderId(file.id);
      else setViewingFile(file);
      return;
    }

    if (action === "rename") {
      const newName = window.prompt("Enter new name:", file.name);
      if (newName && newName !== file.name) {
        try {
          await renameFile(file.id, newName);
          await refresh();
        } catch {
          alert("Failed to rename file");
        }
      }
      return;
    }

    if (action === "star") {
      try {
        await toggleStar(file.id, file.starred);
        await refresh();
      } catch (e) {
        alert(e?.message || "Failed to update starred");
      }
      return;
    }

    if (action === "share") {
      const targetEmail = window.prompt("Enter email to share with:");
      if (targetEmail) {
        try {
          await shareFile(file.id, targetEmail);
          alert("File shared successfully");
        } catch (e) {
          alert(e?.message || "Failed to share file");
        }
      }
      return;
    }

    if (action === "delete") {
      if (window.confirm(`Move ${file.name} to trash?`)) {
        try {
          await moveToTrash(file.id);
          await refresh();
        } catch (e) {
          alert(e?.message || "Failed to move to trash");
        }
      }
      return;
    }

    if (action === "download") {
      window.open(`/api/files/${file.id}/download`);
    }
  };

  const goBack = () => {
    if (!currentFolderId) return;
    const currentFolder = items.find((i) => i.id === currentFolderId);
    setCurrentFolderId(currentFolder?.parentId ?? null);
  };

  const currentFolderName = currentFolderId
    ? items.find((i) => i.id === currentFolderId)?.name
    : "My Drive";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "40px", overflowY: "auto" }}>
      <header style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "15px" }}>
        {currentFolderId && !isSearchMode && (
          <button
            onClick={goBack}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} color="white" />
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            {isSearchMode ? (
              <>Search results</>
            ) : currentFolderId ? (
              <>
                <span style={{ opacity: 0.5, fontSize: "1.5rem" }}>My Drive</span>
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

      {isSearchMode && isSearching && <div style={{ marginTop: 20, opacity: 0.8 }}>Searching...</div>}
      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
      {error && <div style={{ marginTop: 20, color: "tomato" }}>{error}</div>}

      {showNoResults && (
        <div
          style={{
            marginTop: 40,
            opacity: 0.75,
            textAlign: "center",
            fontSize: "1.1rem",
            border: "2px dashed var(--border-color)",
            padding: "40px",
            borderRadius: "20px",
          }}
        >
          No results for: <b>{searchQuery}</b>
        </div>
      )}

      {showEmpty && (
        <div
          style={{
            marginTop: 40,
            opacity: 0.6,
            textAlign: "center",
            fontSize: "1.1rem",
            border: "2px dashed var(--border-color)",
            padding: "40px",
            borderRadius: "20px",
          }}
        >
          This folder is empty.
        </div>
      )}

      {!error && visibleItems.length > 0 && (
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