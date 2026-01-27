import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

import Sidebar from "../components/sidebar/Sidebar";
import TopBar from "../components/TopBar";

import { searchFiles } from "../services/filesService";
import { useAuth } from "../context/AuthContext"; // ✅ ADD

export default function Layout() {
  const navigate = useNavigate(); // ✅ ADD
  const { logout } = useAuth();   // ✅ ADD

  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);

  // ✅ Trash state
  const [trash, setTrash] = useState([]);

  // refresh hook from MyDrive
  const [driveRefresh, setDriveRefresh] = useState(null);

  async function handleSearch(q) {
    setQuery(q);

    if (!q.trim()) {
      setData(null);
      return;
    }

    try {
      const results = await searchFiles(q);
      setData(results);
    } catch (e) {
      setData({ error: e.message || "Search failed" });
    }
  }

  const searchState = {
    query,
    data,
    setQuery,
    setData,
    clear: () => {
      setQuery("");
      setData(null);
    },
    search: handleSearch,
  };

  // ✅ Logout handler
  function handleLogout() {
    logout();               // מוחק token + user מה-localStorage
    navigate("/login");     // מעביר לעמוד login
  }

  // ✅ Add to trash
  function addToTrash(item) {
    setTrash((prev) => {
      if (prev.some((x) => x.id === item.id)) return prev;
      return [{ ...item, deletedAt: new Date().toISOString() }, ...prev];
    });
  }

  function removeFromTrash(id) {
    setTrash((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onDriveRefresh={() => driveRefresh?.()} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* ✅ pass onLogout */}
        <TopBar searchState={searchState} onLogout={handleLogout} />

        <div style={{ flex: 1, overflow: "auto" }}>
          <Outlet
            context={{
              searchState,
              setDriveRefresh,
              trash,
              setTrash,
              addToTrash,
              removeFromTrash,
            }}
          />
        </div>
      </div>
    </div>
  );
}