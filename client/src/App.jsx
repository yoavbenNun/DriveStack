import { Routes, Route, Navigate } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";
import Layout from "./layout/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import FolderPage from "./pages/FolderPage";
import MyDrive from "./pages/MyDrive";
import SharedWithMe from "./pages/SharedWithMe";
import Recent from "./pages/Recent";
import StarredPage from "./pages/StarredPage";
import Trash from "./pages/Trash";

export default function App() {
  return (
    <Routes>
      {/* ✅ Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ✅ Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/drive" replace />} />
          <Route path="/drive" element={<MyDrive />} />
          <Route path="/shared" element={<SharedWithMe />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/starred" element={<StarredPage />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/folder/:id" element={<FolderPage />} />
        </Route>
      </Route>

      {/* ✅ Fallback */}
      <Route path="*" element={<Navigate to="/drive" replace />} />
    </Routes>
  );
}