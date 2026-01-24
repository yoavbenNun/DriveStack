import { useEffect, useMemo, useState } from "react";
import { listFiles } from "../services/filesService";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import { deleteFile } from "../services/filesService";
import { getFileById } from "../services/filesService";

function toDataUrl(file) {
  if (!file?.content) return null;
  const mime = file.mime || "application/octet-stream";
  return `data:${mime};base64,${file.content}`;
}

function isTextMime(mime) {
  return (mime || "").startsWith("text/")
    || ["application/json", "application/xml"].includes(mime);
}

function base64ToText(base64) {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    try { return atob(base64); } catch { return ""; }
  }
}

export default function MyDrive({ onReady, onFolderChange }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [preview, setPreview] = useState(null); // {id,name,content?}
  const [previewLoading, setPreviewLoading] = useState(false);

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
    onReady?.({ refresh });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // notify parent (Dashboard) so Sidebar can upload into current folder
  useEffect(() => {
    onFolderChange?.(currentFolderId);
  }, [currentFolderId, onFolderChange]);

  const visibleItems = useMemo(() => {
    if (loading || error) return [];
    const cur = currentFolderId ?? null;
    return items.filter((it) => (it.parentId ?? null) === cur);
  }, [items, currentFolderId, loading, error]);

  const isEmpty = useMemo(
    () => !loading && !error && visibleItems.length === 0,
    [loading, error, visibleItems]
  );

  async function openItem(item) {
    if (item.type === "folder") {
      setCurrentFolderId(item.id);
      return;
    }

    setPreviewLoading(true);
    try {
      const full = await getFileById(item.id); 
      console.log("FULL:", full);
      console.log("mime:", full?.mime, "contentLen:", full?.content?.length);
      setPreview({ ...item, ...full });
    } catch (e) {
      alert(e.message || "Failed to open file");
    } finally {
      setPreviewLoading(false);
    }
  }

  function goBack() {
    if (currentFolderId === null) return;
    const curFolder = items.find((x) => x.id === currentFolderId);
    setCurrentFolderId(curFolder?.parentId ?? null);
  }
  
  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteFile(item.id);
      await refresh();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }
  
  function guessMime(name, mime) {
    if (mime && mime !== "application/octet-stream") return mime;
    const n = (name || "").toLowerCase();
    if (n.endsWith(".pdf")) return "application/pdf";
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
    if (n.endsWith(".txt")) return "text/plain";
    return mime || "application/octet-stream";
  }

  const mime = guessMime(preview?.name, preview?.mime);
  const dataUrl = preview?.content ? `data:${mime};base64,${preview.content}` : null;

  return (
    <div style={{ padding: 24 }}>
      {/* Back + current path */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={goBack}
          disabled={currentFolderId === null}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "inherit",
            cursor: currentFolderId === null ? "not-allowed" : "pointer",
            opacity: currentFolderId === null ? 0.5 : 1,
          }}
        >
          Back
        </button>

        <div style={{ opacity: 0.7 }}>
          {currentFolderId === null ? "Root" : "Inside folder"}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <FilesToolbar
          viewMode={viewMode}
          onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
          onRefresh={refresh}
        />
      </div>

      {loading && <div style={{ marginTop: 16 }}>Loading...</div>}
      {error && <div style={{ marginTop: 16, color: "tomato" }}>{error}</div>}
      {isEmpty && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>
          This folder is empty
        </div>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {viewMode === "grid" ? (
            <FilesGrid items={visibleItems} onOpen={openItem} onDelete={handleDelete} />
          ) : (
            <FilesList items={visibleItems} onOpen={openItem} onDelete={handleDelete} />
          )}
        </div>
      )}
      {previewLoading && <div style={{ marginTop: 12 }}>Opening...</div>}

      {preview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999
          }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{
              width: "min(900px, 90vw)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "var(--sidebar-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: 16,
              padding: 18
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{preview.name}</div>
              <button
                onClick={() => setPreview(null)}
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
              id: {preview.id}
            </div>

            {dataUrl && mime.startsWith("image/") && (
            <img
              src={dataUrl}
              alt={preview.name}
              style={{ width: "100%", borderRadius: 12, marginTop: 12 }}
            />
          )}

          {dataUrl && mime === "application/pdf" && (
            <iframe
              title="pdf"
              src={dataUrl}
              style={{ width: "100%", height: "70vh", border: "none", marginTop: 12 }}
            />
          )}

          {preview?.content && isTextMime(mime) && (
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              {base64ToText(preview.content)}
            </pre>
          )}

          {dataUrl && !mime.startsWith("image/") && mime !== "application/pdf" && !isTextMime(mime) && (
            <a
              href={dataUrl}
              download={preview.name}
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                color: "inherit",
                textDecoration: "none"
              }}
            >
              Download file
            </a>
          )}

          {!dataUrl && (
            <div style={{ marginTop: 12, opacity: 0.7 }}>
              (No content returned)
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
