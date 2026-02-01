import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import TopBar from "../components/TopBar";
import MyDrive from "./MyDrive";
import StarredPage from "./StarredPage";
import TrashPage from "./Trash";

const DashboardPage = () => {
  const [driveApi, setDriveApi] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);

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
      {/* 1. Side Navigation */}
      <Sidebar
        onDriveRefresh={() => driveApi?.refresh()}
        currentFolderId={currentFolderId}
      />

      {/* 2. Main Work Area (TopBar + Content) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* 3. Top Navigation */}
        <TopBar />

        {/* 4. Scrollable Content Area */}
        <main  style={{
            flex: 1,
            padding: "40px",
            overflowY: "auto",
            color: "var(--text-color)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Routes>
            {/* /dashboard */}
            <Route
              index
              element={
                <MyDrive onReady={setDriveApi} onFolderChange={setCurrentFolderId} />
              }
            />
            <Route path="starred" element={<StarredPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="recent" element={<div>Recent</div>} />
            <Route path="shared-with-me" element={<div>Shared</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
