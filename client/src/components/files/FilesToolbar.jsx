export default function FilesToolbar({ viewMode, onToggle, onRefresh }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button onClick={onToggle}>
        View: {viewMode === "grid" ? "Grid" : "List"}
      </button>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  );
}
