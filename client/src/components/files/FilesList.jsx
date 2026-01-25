import { Folder, FileText, Trash2 } from "lucide-react";

export default function FilesList({ items, onOpen, onDelete }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.6fr", padding: 10, opacity: 0.75 }}>
        <div>Name</div><div>Type</div><div>Size</div><div></div>
      </div>

      {items.map((it) => {
        const isFolder = it.type === "folder";

        return (
          <div
            key={it.id}
            onDoubleClick={() => onOpen?.(it)}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 0.6fr",
              padding: 10,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              cursor: onOpen ? "pointer" : "default",
              userSelect: "none",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isFolder ? <Folder size={18} /> : <FileText size={18} />}
              <span>{it.name}</span>
            </div>

            <div>{isFolder ? "folder" : "file"}</div>
            <div>{it.size ?? "-"}</div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(it);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "inherit",
                  borderRadius: 10,
                  cursor: "pointer",
                  padding: "6px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
