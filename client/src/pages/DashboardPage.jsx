import React, {useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/SideBar";
import TopBar from "../components/TopBar";
import MyDrive from "./MyDrive";
import StarredPage from "./StarredPage";
import TrashPage from "./Trash";
import RecentPage from "./Recent";
import SharedWithMePage from "./SharedWithMe";
import { searchFiles } from "../services/filesService";

const DashboardPage = () => {
  const [driveApi, setDriveApi] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
useEffect(() => {
  const q = searchQuery.trim();

  if (!q) {
    setSearchResults([]);
    setIsSearching(false);
    return;
  }

  let cancelled = false;

  const t = setTimeout(async () => {
    try {
      setIsSearching(true);
      const results = await searchFiles(q);
      if (!cancelled) setSearchResults(results);
    } catch (e) {
      console.error("search failed:", e);
      if (!cancelled) setSearchResults([]);
    } finally {
      if (!cancelled) setIsSearching(false);
    }
  }, 300);

  return () => {
    cancelled = true;
    clearTimeout(t);
  };
}, [searchQuery]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      margin: 0,
      padding: 0
    }}>
      <Sidebar
        onDriveRefresh={() => driveApi?.refresh()}
        currentFolderId={currentFolderId}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* transfer to TopBar */}
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main style={{
          flex: 1,
          padding: "40px",
          overflowY: "auto",
          color: "var(--text-color)",
          display: "flex",
          flexDirection: "column",
        }}>
          <Routes>
            <Route
              index
              element={
                <MyDrive
                  onReady={setDriveApi}
                  onFolderChange={setCurrentFolderId}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                />
              }
            />
            <Route path="starred" element={<StarredPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="recent" element={<RecentPage />} />
            <Route path="shared-with-me" element={<SharedWithMePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
