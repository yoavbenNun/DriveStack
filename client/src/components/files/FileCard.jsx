import { Folder, FileText, Trash2 } from "lucide-react";

export default function FileCard({ item, onOpen, onDelete }) {
  const isFolder = item.type === "folder";

  return (
    <div
      onDoubleClick={() => onOpen?.(item)}
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 12,
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* Delete button */}
      <button
        title="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(item);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 10,
          padding: "6px 8px",
          cursor: "pointer",
          color: "inherit",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Trash2 size={16} />
      </button>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 14, marginBottom: 10 }}>
        {isFolder ? <Folder size={48} /> : <FileText size={48} />}
      </div>

      <div style={{ textAlign: "center", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.name}
      </div>

      <div style={{ textAlign: "center", opacity: 0.65, fontSize: 12, marginTop: 4 }}>
        {isFolder ? "folder" : "file"}
      </div>
    </div>
  );
}
