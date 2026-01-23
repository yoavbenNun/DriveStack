import { useEffect, useMemo, useState } from "react";
import { listFiles } from "../services/filesService";
import FilesToolbar from "../components/files/FilesToolbar";
import FilesGrid from "../components/files/FilesGrid";
import FilesList from "../components/files/FilesList";

export default function MyDrive({ onReady }) {
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    onReady?.({ refresh }); // expose refresh to DashboardPage/Sidebar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items]
  );

  return (
    <div style={{ padding: 24 }}>
      <FilesToolbar
        viewMode={viewMode}
        onToggle={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
        onRefresh={refresh}
      />

      {loading && <div style={{ marginTop: 16 }}>Loading...</div>}
      {error && <div style={{ marginTop: 16, color: "tomato" }}>{error}</div>}
      {isEmpty && (
        <div style={{ marginTop: 16, opacity: 0.7 }}>Your drive is empty</div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {viewMode === "grid" ? (
            <FilesGrid items={items} />
          ) : (
            <FilesList items={items} />
          )}
        </div>
      )}
    </div>
  );
}
