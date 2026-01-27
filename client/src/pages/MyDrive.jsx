import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import ShareModal from "../components/files/ShareModal";

import { onFileUpdated, emitFileUpdated } from "../utils/filesEvents";

import {
  listFiles,
  createFolder,
  uploadFile,
  deleteFile,
  getFile,
  starFile,
  unstarFile,
} from "../services/filesService";

function isDir(item) {
  return item?.type === "dir" || item?.type === "folder";
}

function guessMime(name = "") {
  const lower = name.toLowerCase();
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv"))
    return "text/plain";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return null;
}

function isProbablyText(str) {
  if (typeof str !== "string") return false;
  const weird = str.match(/[^\x09\x0A\x0D\x20-\x7E]/g);
  return !weird || weird.length < 5;
}

function mergeInList(list, payload) {
  return list.map((x) => (x.id === payload.id ? { ...x, ...payload } : x));
}

function mergeInSearchData(prev, payload) {
  if (!prev) return prev;

  // array shape
  if (Array.isArray(prev)) return mergeInList(prev, payload);

  // object shape: {results: []} or {items: []}
  const raw = prev.results || prev.items;
  if (Array.isArray(raw)) {
    const updated = mergeInList(raw, payload);
    if (prev.results) return { ...prev, results: updated };
    if (prev.items) return { ...prev, items: updated };
  }

  return prev;
}

function removeFromSearchData(prev, id) {
  if (!prev) return prev;

  if (Array.isArray(prev)) return prev.filter((x) => x.id !== id);

  const raw = prev.results || prev.items;
  if (Array.isArray(raw)) {
    const updated = raw.filter((x) => x.id !== id);
    if (prev.results) return { ...prev, results: updated };
    if (prev.items) return { ...prev, items: updated };
  }

  return prev;
}

export default function MyDrive({ onReady }) {
  const ctx = useOutletContext() || {};
  const searchState = ctx.searchState;
  const setDriveRefresh = ctx.setDriveRefresh;
  const addToTrash = ctx.addToTrash;

  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // viewer modal
  const [openFile, setOpenFile] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);

  // ✅ share modal
  const [shareFile, setShareFile] = useState(null);

  function handleShare(item) {
    if (!item?.id) return;

    // only owner can share
    let currentUserId = null;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      currentUserId = u?.id || null;
    } catch {}

    if (!currentUserId || item.ownerId !== currentUserId) {
      alert("Only the owner can share this file");
      return;
    }

    setShareFile(item);
  }

  // folder navigation
  const [path, setPath] = useState([]);
  const currentFolderId = path.length ? path[path.length - 1] : null;

  // -------------------------
  // ✅ Refresh
  // -------------------------
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
    setDriveRefresh?.(() => refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // ✅ Live updates listener (from anywhere in the app)
  // -------------------------
  useEffect(() => {
    const unsub = onFileUpdated((payload) => {
      if (!payload?.id) return;

      // ✅ update main list
      setItems((prev) => mergeInList(prev, payload));

      // ✅ update search results if searching
      if (searchState?.query?.trim() && typeof searchState?.setData === "function") {
        searchState.setData((prev) => mergeInSearchData(prev, payload));
      }
    });

    return unsub;
  }, [searchState]);

  // -------------------------
  // ⭐ Star Logic
  // -------------------------
  function isStarredFn(item) {
    return !!item?.starredAt;
  }

  async function onToggleStar(item) {
    if (!item?.id) return;

    const currentlyStarred = !!item.starredAt;
    const optimisticStarredAt = currentlyStarred ? null : new Date().toISOString();

    // ✅ optimistic update in main list
    setItems((prev) =>
      prev.map((x) =>
        x.id === item.id ? { ...x, starredAt: optimisticStarredAt } : x
      )
    );

    // ✅ optimistic update in search results (if searching)
    if (searchState?.query?.trim() && typeof searchState?.setData === "function") {
      searchState.setData((prev) =>
        mergeInSearchData(prev, { id: item.id, starredAt: optimisticStarredAt })
      );
    }

    // ✅ broadcast instantly (so sidebars/recent/starred pages update)
    emitFileUpdated({ id: item.id, starredAt: optimisticStarredAt });

    try {
      // ✅ server update (returns updated item)
      const updated = currentlyStarred
        ? await unstarFile(item.id)
        : await starFile(item.id);

      // ✅ sync with real server response
      setItems((prev) => mergeInList(prev, updated));

      if (searchState?.query?.trim() && typeof searchState?.setData === "function") {
        searchState.setData((prev) => mergeInSearchData(prev, updated));
      }

      // ✅ final broadcast with server truth
      emitFileUpdated({ id: updated.id, starredAt: updated.starredAt });
    } catch (e) {
      alert(e.message || "Failed to toggle star");
      refresh(); // rollback
    }
  }

  // -------------------------
  // ✅ Create folder
  // -------------------------
  async function handleNewFolder() {
    const name = prompt("Folder name:");
    if (!name || !name.trim()) return;

    try {
      await createFolder(name.trim(), currentFolderId);
      await refresh();
    } catch (e) {
      alert(e.message || "Failed to create folder");
    }
  }

  // -------------------------
  // ✅ Upload file
  // -------------------------
  async function handleUploadFile(file) {
    try {
      await uploadFile(file, currentFolderId);
      await refresh();
    } catch (e) {
      alert(e.message || "Failed to upload file");
    }
  }

  // -------------------------
  // ✅ Delete -> Trash
  // -------------------------
  async function handleDelete(item) {
    const ok = window.confirm(`Delete "${item.name}"?`);
    if (!ok) return;

    try {
      await deleteFile(item.id);

      // ✅ remove locally
      setItems((prev) => prev.filter((x) => x.id !== item.id));

      // ✅ remove from search results too
      if (searchState?.query?.trim() && typeof searchState?.setData === "function") {
        searchState.setData((prev) => removeFromSearchData(prev, item.id));
      }

      // ✅ broadcast delete (so other menus remove instantly)
      emitFileUpdated({ id: item.id, deletedAt: new Date().toISOString() });

      addToTrash?.(item);
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  // -------------------------
  // ✅ Open file/folder
  // -------------------------
  async function handleOpen(item) {
    if (isDir(item)) {
      openFolder(item.id);
      return;
    }

    try {
      setOpenLoading(true);
      const full = await getFile(item.id);
      setOpenFile(full);
    } catch (e) {
      alert(e.message || "Failed to open file");
    } finally {
      setOpenLoading(false);
    }
  }

  function handleShare(item) {
    if (!item?.id) return;
    // ✅ only owner can share
    let currentUserId = null;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      currentUserId = u?.id || null;
    } catch {}

    if (item.ownerId && currentUserId && item.ownerId !== currentUserId) {
      alert("You can only share your own files");
      return;
    }
    setShareFile(item);
  }

  // -------------------------
  // ✅ Search handling
  // -------------------------
  const isSearching = !!searchState?.query?.trim();
  const searchData = searchState?.data;

  const searchResults = useMemo(() => {
    const raw = searchData?.results || searchData?.items || searchData || [];
    return Array.isArray(raw) ? raw : [];
  }, [searchData]);

  // -------------------------
  // ✅ Folder items
  // -------------------------
  const folderItems = useMemo(() => {
    const children = items.filter((it) => (it.parentId ?? null) === currentFolderId);

    const sorted = [...children].sort((a, b) => {
      const aDir = isDir(a);
      const bDir = isDir(b);
      if (aDir && !bDir) return -1;
      if (!aDir && bDir) return 1;
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      return an.localeCompare(bn);
    });

    return sorted;
  }, [items, currentFolderId]);

  // -------------------------
  // ✅ Breadcrumbs
  // -------------------------
  const byId = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ id: null, name: "My Drive" }];
    for (const fid of path) {
      crumbs.push({ id: fid, name: byId.get(fid)?.name || "Folder" });
    }
    return crumbs;
  }, [path, byId]);

  function openFolder(folderId) {
    if (!folderId) return;

    // ✅ when entering folder while searching -> clear search
    if (isSearching) {
      searchState?.setQuery?.("");
      searchState?.clear?.();
    }

    setPath((prev) => [...prev, folderId]);
  }

  function goBack() {
    setPath((prev) => prev.slice(0, -1));
  }

  function goToCrumb(index) {
    if (index === 0) setPath([]);
    else setPath((prev) => prev.slice(0, index));
  }

  const dataToShow = isSearching ? searchResults : folderItems;

  const isEmpty = useMemo(() => {
    return !loading && !error && items.length === 0;
  }, [loading, error, items]);

  // -------------------------
  // ✅ UI
  // -------------------------
  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb + Back */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={goBack}
          disabled={path.length === 0}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "2px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-color)",
            cursor: path.length === 0 ? "not-allowed" : "pointer",
            opacity: path.length === 0 ? 0.5 : 1,
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {breadcrumbs.map((c, idx) => (
            <div key={`${c.id ?? "root"}-${idx}`} style={{ display: "flex", gap: 10 }}>
              <span
                onClick={() => goToCrumb(idx)}
                style={{
                  cursor: "pointer",
                  fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                  opacity: idx === breadcrumbs.length - 1 ? 1 : 0.85,
                }}
              >
                {c.name}
              </span>
              {idx !== breadcrumbs.length - 1 && <span style={{ opacity: 0.5 }}>/</span>}
            </div>
          ))}
        </div>

        {isSearching && (
          <div style={{ marginLeft: "auto", opacity: 0.8 }}>
            Showing results for: <b>{searchState.query}</b>
          </div>
        )}
      </div>

      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
        onNewFolder={handleNewFolder}
        onUploadFile={handleUploadFile}
        currentFolderName={breadcrumbs[breadcrumbs.length - 1]?.name}
      />

      {loading && <div style={{ marginTop: 16 }}>Loading...</div>}
      {error && <div style={{ marginTop: 16, color: "tomato" }}>{error}</div>}

      {!loading && !error && !isSearching && isEmpty && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>Your drive is empty</div>
      )}

      {!loading && !error && dataToShow.length === 0 && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>
          {isSearching ? "No results found" : "This folder is empty"}
        </div>
      )}

      {!loading && !error && dataToShow.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {viewMode === "grid" ? (
            <FilesGrid
              items={dataToShow}
              onOpen={handleOpen}
              onDelete={handleDelete}
              isStarredFn={isStarredFn}
              onToggleStar={onToggleStar}
              onShare={handleShare}
            />
          ) : (
            <FilesList
              items={dataToShow}
              onOpen={handleOpen}
              onDelete={handleDelete}
              isStarredFn={isStarredFn}
              onToggleStar={onToggleStar}
              onShare={handleShare}
            />
          )}
        </div>
      )}

      {/* Share modal */}
      <ShareModal open={!!shareFile} file={shareFile} onClose={() => setShareFile(null)} />

      {/* Viewer modal */}
      {openLoading && <div style={{ marginTop: 10, opacity: 0.8 }}>Opening file...</div>}

      {openFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setOpenFile(null)}
        >
          <div
            style={{
              width: "min(900px, 92vw)",
              height: "min(700px, 85vh)",
              background: "#111",
              color: "#fff",
              borderRadius: 16,
              padding: 16,
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0 }}>{openFile.name}</h2>
                <div style={{ opacity: 0.7, fontSize: 14 }}>
                  {openFile.type} • {openFile.id}
                </div>
              </div>

              <button
                onClick={() => setOpenFile(null)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #444",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            <hr style={{ opacity: 0.2, margin: "12px 0" }} />

            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 10 }}>
              <div><b>Created:</b> {openFile.createdAt || "-"}</div>
              <div><b>Updated:</b> {openFile.updatedAt || "-"}</div>
              <div><b>Size:</b> {openFile.size ?? "-"}</div>
              <div><b>Mime:</b> {openFile.mimeType ?? guessMime(openFile.name) ?? "-"}</div>
              <div><b>Encoding:</b> {openFile.encoding ?? (guessMime(openFile.name)?.startsWith("text/") ? "text" : "-")}</div>
            </div>

            <hr style={{ opacity: 0.2, margin: "12px 0" }} />

            {openFile.content ? (
              (() => {
                const mime = openFile.mimeType ?? guessMime(openFile.name);
                const encoding =
                  openFile.encoding ?? (mime?.startsWith("text/") ? "text" : null);

                if (encoding === "text" || mime?.startsWith("text/") || isProbablyText(openFile.content)) {
                  return <pre style={{ whiteSpace: "pre-wrap" }}>{openFile.content}</pre>;
                }

                if (mime?.startsWith("image/")) {
                  return (
                    <img
                      style={{ maxWidth: "100%", borderRadius: 12 }}
                      src={`data:${mime};base64,${openFile.content}`}
                      alt={openFile.name}
                    />
                  );
                }

                if (mime === "application/pdf") {
                  return (
                    <iframe
                      title="pdf"
                      style={{ width: "100%", height: "520px", border: "none", borderRadius: 12 }}
                      src={`data:application/pdf;base64,${openFile.content}`}
                    />
                  );
                }

                return <div style={{ opacity: 0.8 }}>File content exists but cannot preview this type.</div>;
              })()
            ) : (
              <div style={{ opacity: 0.7 }}>No content returned from server</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}