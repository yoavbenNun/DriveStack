import React, { useEffect, useRef, useState } from "react";
import { Search, Moon, Sun, Settings, LogOut, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function TopBar({ searchState, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  const [localQuery, setLocalQuery] = useState(searchState?.query || "");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // sync when outside clears query
  useEffect(() => {
    setLocalQuery(searchState?.query || "");
  }, [searchState?.query]);

  // debounce + call Layout search
  useEffect(() => {
    const q = localQuery;

    // אם ריק -> ננקה
    if (!q.trim()) {
      setLoading(false);
      searchState?.clear?.();
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        await searchState?.search?.(q);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuery]);

  function handleClearSearch() {
    setLocalQuery("");
    setLoading(false);
    searchState?.clear?.();

    // מחזיר פוקוס לשדה (נוח רצח)
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const showClear = !!localQuery.trim();

  return (
    <div
      style={{
        height: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 60px",
        borderBottom: "3px solid var(--border-color)",
      }}
    >
      {/* Search */}
      <div
        style={{
          flex: "0 1 1000px",
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--search-bg)",
          padding: "20px 40px",
          borderRadius: "20px",
          gap: "25px",
          position: "relative",
        }}
      >
        <Search size={30} opacity={0.8} />

        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search Drive..."
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            width: "100%",
            outline: "none",
            fontSize: "1.6rem",
          }}
        />

        {/* ✅ X Clear */}
        {showClear && (
          <button
            onClick={handleClearSearch}
            title="Clear search"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "2px solid var(--border-color)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.75,
              transition: "opacity 0.12s ease, transform 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <X size={22} style={{ stroke: "var(--text-color)" }} />
          </button>
        )}

        {loading && (
          <div style={{ fontSize: "1rem", opacity: 0.7 }}>Searching...</div>
        )}

        {!!searchState?.data?.error && (
          <div style={{ fontSize: "1rem", color: "tomato" }}>
            {searchState.data.error}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "50px" }}>
        {/* Theme */}
        <button
          onClick={toggleTheme}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "inherit",
          }}
        >
          {theme === "dark" ? <Sun size={30} /> : <Moon size={30} />}
        </button>

        {/* Settings icon */}
        <Settings size={70} />

        {/* ✅ Logout */}
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: "2px solid var(--border-color)",
            borderRadius: 14,
            padding: "10px 16px",
            cursor: "pointer",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          <LogOut size={22} />
          Logout
        </button>

        {/* Avatar */}
        <div
          style={{
            width: "100px",
            height: "55px",
            borderRadius: "50%",
            backgroundColor: "#4facfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: "bold",
            color: "white",
          }}
        >
          U
        </div>
      </div>
    </div>
  );
}