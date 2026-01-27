// client/src/components/files/FilesList.jsx
import { Share2 } from "lucide-react";
import StarButton from "./StarButton";

export default function FilesList({
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => {
        const starred = isStarredFn ? isStarredFn(item) : false;

        return (
          <div
            key={item.id}
            style={{
              border: "2px solid var(--border-color)",
              borderRadius: 14,
              padding: "12px 14px",
              background: "var(--card-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              onClick={() => onOpen?.(item)}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                flex: 1,
                wordBreak: "break-word",
              }}
            >
              {item.name}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* ⭐ STAR (only when enabled) */}
              {typeof onToggleStar === "function" && (
                <StarButton
                  starred={starred}
                  // ✅ StarButton כבר עושה stopPropagation בפנים,
                  // אז לא מעבירים e ולא קוראים stopPropagation כאן
                  onClick={() => onToggleStar(item)}
                  size={22}
                />
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
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: "2px solid var(--border-color)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.85,
                  }}
                >
                  <Share2 size={18} style={{ stroke: "#9ca3af" }} />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen?.(item);
                }}
                style={{
                  padding: "8px 12px",
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
                    padding: "8px 12px",
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