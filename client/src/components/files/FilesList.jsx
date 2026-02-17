import { Folder, FileText } from "lucide-react"; 
import FileActionMenu from './FileActionMenu';

export default function FilesList({ items, onAction, isTrash }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, overflow: "visible" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.6fr", padding: 10, opacity: 0.75 }}>
        <div>Name</div><div>Type</div><div>Size</div><div></div>
      </div>

      {items.map((it) => {
        // folder detection logic
        const isFolder = it.type === "folder" || !it.name.includes('.');

        return (
          <div
            key={it.id}
            onDoubleClick={() => onAction?.('open', it)}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 0.6fr",
              padding: 10,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              userSelect: "none",
              alignItems: "center",
              position: "relative" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isFolder ? <Folder size={18} color="#74b9ff" /> : <FileText size={18} />}
              <span>{it.name}</span>
            </div>

            <div>{isFolder ? "Folder" : "File"}</div>
            <div>{it.size ?? "-"}</div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <FileActionMenu file={it} onAction={onAction} isTrash={isTrash} />
            </div>
          </div>
        );
      })}
    </div>
  );
}