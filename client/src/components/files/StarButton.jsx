import { Star } from "lucide-react";

// ✅ reusable star button
// size = icon size (px)
export default function StarButton({ starred, onClick, size = 22 }) {
  return (
    <button
      type="button" // ✅ שלא יעשה submit בטעות
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        border: "1px solid var(--border-color)",
        background: "rgba(255,255,255,0.04)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,            // ✅ חשוב!!
        pointerEvents: "auto", // ✅ חשוב!!
      }}
    >
      <Star
        size={size}
        style={{
          stroke: "#9ca3af",
          fill: starred ? "#9ca3af" : "transparent",
        }}
      />
    </button>
  );
}