import { useEffect, useMemo, useState } from "react";
import {
  listFiles,
  deleteFile,
  starFile,
  unstarFile,
} from "../services/filesService";

export default function useFiles(fetchFn = listFiles) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  async function removeItem(item) {
    await deleteFile(item.id);
    setItems((prev) => prev.filter((x) => x.id !== item.id));
  }

  async function toggleStar(item) {
    const currentlyStarred = !!item.starredAt;

    // optimistic UI
    setItems((prev) =>
      prev.map((x) =>
        x.id === item.id
          ? { ...x, starredAt: currentlyStarred ? null : new Date().toISOString() }
          : x
      )
    );

    try {
      const updated = currentlyStarred
        ? await unstarFile(item.id)
        : await starFile(item.id);

      // sync with server response
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id ? { ...x, starredAt: updated.starredAt ?? null } : x
        )
      );
    } catch (e) {
      refresh(); // rollback safe
      throw e;
    }
  }

  return {
    items,
    setItems,
    loading,
    error,
    refresh,
    removeItem,
    toggleStar,
  };
}