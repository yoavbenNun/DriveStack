// client/src/components/files/FilesGrid.jsx
import { Share2 } from "lucide-react";
import StarButton from "./StarButton";

export default function FilesGrid({
  items,
  onOpen,
  onDelete,
  isStarredFn,
  onToggleStar,
  onShare,
}) {
  // ✅ hide "Share" for files that are not owned by the current user
  let currentUserId = null;
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    currentUserId = u?.id || null;
  } catch {}

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 14,
      }}
    >
      {items.map((item) => {
        const starred = isStarredFn ? isStarredFn(item) : false;

        return (
          <div
            key={item.id}
            style={{
              position: "relative",
              border: "2px solid var(--border-color)",
              borderRadius: 14,
              padding: 14,
              background: "var(--card-bg)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* ⭐ STAR (only when enabled) */}
            {typeof onToggleStar === "function" && (
              <div style={{ position: "absolute", top: -10, right: 8 }}>
                <StarButton
                  starred={starred}
                  // ✅ StarButton כבר עושה stopPropagation בפנים,
                  // אז לא מעבירים e ולא קוראים stopPropagation כאן
                  onClick={() => onToggleStar(item)}
                  size={22}
                />
              </div>
            )}

            {/* 🔗 SHARE (only when enabled) */}
            {typeof onShare === "function" && item?.ownerId === currentUserId && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare(item);
                }}
                title="Share"
                style={{
                  position: "absolute",
                  top: -10,
                  left: 8,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "2px solid var(--border-color)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.85,
                  zIndex: 60,
                }}
              >
                <Share2 size={18} style={{ stroke: "#9ca3af" }} />
              </button>
            )}

            {/* Name */}
            <div
              onClick={() => onOpen?.(item)}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                wordBreak: "break-word",
                paddingRight: 54, // שלא ייכנס מתחת לכוכב
              }}
            >
              {item.name}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen?.(item);
                }}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "2px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-color)",
                  cursor: "pointer",
                }}
              >
                Open
              </button>

              {typeof onDelete === "function" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "none",
                    background: "#ff3b30",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}