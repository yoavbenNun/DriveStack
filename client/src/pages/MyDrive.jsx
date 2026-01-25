import { useEffect, useMemo, useState } from "react";
import { listFiles, deleteFile, getFileById } from "../services/filesService";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";

function isTextMime(mime) {
  return (mime || "").startsWith("text/") ||
    ["application/json", "application/xml"].includes(mime);
}

function base64ToText(base64) {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch {
    try { return atob(base64); } catch { return ""; }
  }
}

async function base64ToBlobUrl(base64, mime) {
  const clean = String(base64 || "")
    .replace(/\s/g, "")
    .replace(/^data:.*;base64,/, "");

  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
  return URL.createObjectURL(blob);
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

export default function MyDrive({ onReady, onFolderChange }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

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

  // Cleanup blob url on unmount / change
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function openItem(item) {
  if (item.type === "folder") {
    setCurrentFolderId(item.id);
    return;
  }

  setPreviewLoading(true);
  try {
    const full = await getFileById(item.id);
    const finalMime = guessMime(item?.name, full?.mime);

    console.log("mime:", full?.mime);
    console.log("size(meta):", full?.size);
    console.log("base64Len:", full?.content?.length);
    console.log("prefix:", full?.content?.slice(0, 12));

    const url = full?.content ? await base64ToBlobUrl(full.content, finalMime) : null;

    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

      setPreview({ ...item, ...full, mime: finalMime });
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

  function closePreview() {
    setPreview(null);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const mime = preview?.mime || "application/octet-stream";

  return (
    <div style={{ padding: 24 }}>
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
            zIndex: 99999,
          }}
          onClick={closePreview}
        >
          <div
            style={{
              width: "min(900px, 90vw)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "var(--sidebar-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: 16,
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>{preview.name}</div>
              <button
                onClick={closePreview}
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
              id: {preview.id}
            </div>

            {blobUrl && mime.startsWith("image/") && (
              <img
                src={blobUrl}
                alt={preview.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  width: "auto",
                  height: "auto",
                  display: "block",
                  marginTop: 12,
                  marginInline: "auto",
                  borderRadius: 12
                }}
              />
            )}

            {blobUrl && mime === "application/pdf" && (
              <div style={{ marginTop: 12 }}>
                <iframe
                  title="pdf"
                  src={blobUrl}
                  style={{ width: "100%", height: "65vh", border: "none" }}
                />
                <a href={blobUrl} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 8 }}>
                  Open in new tab
                </a>
              </div>
            )}

            {preview?.content && isTextMime(mime) && (
              <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                {base64ToText(preview.content)}
              </pre>
            )}

            {blobUrl && !mime.startsWith("image/") && mime !== "application/pdf" && !isTextMime(mime) && (
              <a
                href={blobUrl}
                download={preview.name}
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  padding: "10px 12px",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                Download file
              </a>
            )}

            {!blobUrl && (
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
