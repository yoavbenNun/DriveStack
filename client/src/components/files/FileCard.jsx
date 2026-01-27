import StarButton from "./StarButton";

export default function FileCard({ item, onOpen, onDelete, onToggleStar }) {
  const starred = !!item.starredAt;

  return (
    <div
      onClick={() => onOpen?.(item)}
      style={{
        position: "relative",
        border: "2px solid var(--border-color)",
        borderRadius: 14,
        padding: 14,
        background: "var(--card-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 120,
      }}
    >
      {/* ⭐ top-right */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 50,            // ✅ חשוב!!
          pointerEvents: "auto", // ✅ חשוב!!
        }}
      >
        <StarButton
          starred={starred}
          onClick={() => onToggleStar?.(item)}
        />
      </div>

      {/* Name */}
      <div style={{ fontWeight: 700, wordBreak: "break-word", paddingRight: 55 }}>
        {item.name}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <button
          onClick={(e) => {
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item);
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
      </div>
    </div>
  );
}