import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";
import FileViewerModal from "../components/files/FileViewerModal";
import { onFileUpdated } from "../utils/filesEvents";
import ShareModal from "../components/files/ShareModal";

import {
  listFiles,
  getFile,
  deleteFile,
  starFile,
  unstarFile,
} from "../services/filesService";

export default function FilesPage({
  title,
  filterFn = () => true,
  mode = "grid",
  onDeleteLocal,
  fetchFn = listFiles,
  allowDelete = true,
  allowStar = true,
  allowShare = true,
}) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState(mode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openFile, setOpenFile] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);
  
  const [shareFile, setShareFile] = useState(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFn();
      setItems(data);
    } catch (e) {
      setError(e.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = onFileUpdated((payload) => {
      if (!payload?.id) return;
  
      setItems((prev) => {
        // אם זה מסך מועדפים, וברגע שעושים unstar צריך להעיף אותו מהרשימה
        if (title === "Starred" && payload.starredAt === null) {
          return prev.filter((x) => x.id !== payload.id);
        }
  
        // עדכון רגיל: merge
        return prev.map((x) =>
          x.id === payload.id ? { ...x, ...payload } : x
        );
      });
    });
  
    return unsub;
  }, [title]);

  const dataToShow = useMemo(() => {
    return items
      .filter(filterFn)
      .sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, 50);
  }, [items, filterFn]);

  // ✅ חשוב: מקבל ITEM ולא id
  function isStarredFn(item) {
    return !!item.starredAt;
  }

  // ✅ Toggle שעובד תמיד + מחזיר response מהשרת
  async function onToggleStar(item) {
    try {
      const currentlyStarred = !!item.starredAt;

      // ✅ optimistic UI
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? {
                ...x,
                starredAt: currentlyStarred ? null : new Date().toISOString(),
              }
            : x
        )
      );

      // ✅ call server
      const updated = currentlyStarred
        ? await unstarFile(item.id)
        : await starFile(item.id);

      // ✅ sync with real server response
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, ...updated } : x))
      );

      // ✅ אם אנחנו במסך "Starred" והוא עכשיו unstar → צריך להעלים אותו
      if (title.toLowerCase().includes("starred") && currentlyStarred) {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      }
    } catch (e) {
      alert(e.message || "Failed to toggle star");
      refresh();
    }
  }
  async function handleToggleStar(item) {
    try {
      const currentlyStarred = !!item.starredAt;
  
      // ✅ קריאה לשרת
      const updated = currentlyStarred
        ? await unstarFile(item.id)
        : await starFile(item.id);
  
      // ✅ אם אנחנו במסך Starred ועשינו unstar -> להעיף מיד מהרשימה
      const isStarredPage = title?.toLowerCase().includes("starred");
      if (isStarredPage && currentlyStarred) {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        return;
      }
  
      // ✅ אחרת עדכון רגיל
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, ...updated } : x))
      );
    } catch (e) {
      alert(e.message || "Star failed");
    }
  }

  async function handleOpen(item) {
    if (item.type === "dir" || item.type === "folder") {
      navigate(`/folder/${item.id}`);
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

  async function handleDelete(item) {
    const ok = window.confirm(`Delete "${item.name}"?`);
    if (!ok) return;

    try {
      await deleteFile(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      onDeleteLocal?.(item);
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }
  function handleShare(item) {
    setShareFile(item);
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "2px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-color)",
              cursor: "pointer",
            }}
          >
            View: {viewMode}
          </button>

          <button
            onClick={refresh}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "2px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-color)",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div style={{ marginTop: 16 }}>Loading...</div>}
      {error && <div style={{ marginTop: 16, color: "tomato" }}>{error}</div>}

      {!loading && !error && dataToShow.length === 0 && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>No files</div>
      )}

      {!loading && !error && dataToShow.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {viewMode === "grid" ? (
            <FilesGrid
              items={dataToShow}
              onOpen={handleOpen}
              onDelete={allowDelete ? handleDelete : undefined}
              isStarredFn={isStarredFn}
              onToggleStar={allowStar ? handleToggleStar : undefined}
              onShare={allowShare ? handleShare : undefined}
            />
          ) : (
            <FilesList
              items={dataToShow}
              onOpen={handleOpen}
              onDelete={allowDelete ? handleDelete : undefined}
              isStarredFn={isStarredFn}
              onToggleStar={allowStar ? handleToggleStar : undefined}
              onShare={allowShare ? handleShare : undefined}
            />
          )}

        </div>
      )}

      {openLoading && (
        <div style={{ marginTop: 10, opacity: 0.8 }}>Opening file...</div>
      )}
      <FileViewerModal openFile={openFile} onClose={() => setOpenFile(null)} />
    </div>
  );
}