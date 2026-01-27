import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Cloud,
  FolderPlus,
  Upload,
} from "lucide-react";

import { createFolder, uploadFile } from "../../services/filesService";

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 14,
        cursor: "pointer",
        userSelect: "none",
        background: active ? "rgba(79, 172, 254, 0.18)" : "transparent",
        color: active ? "#4facfe" : "var(--text-color)",
        border: active ? "2px solid var(--border-color)" : "2px solid transparent",
        fontWeight: 600,
        opacity: active ? 1 : 0.88,
      }}
    >
      <Icon size={20} />
      <span style={{ fontSize: "1.05rem" }}>{label}</span>
    </div>
  );
}

export default function Sidebar({ onDriveRefresh }) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const items = [
    { path: "/drive", icon: HardDrive, label: "My Drive" },
    { path: "/shared", icon: Users, label: "Shared with me" },
    { path: "/recent", icon: Clock, label: "Recent" },
    { path: "/starred", icon: Star, label: "Starred" },
    { path: "/trash", icon: Trash2, label: "Trash" },
  ];

  async function handleCreateFolder() {
    setOpen(false);
    const name = prompt("Folder name:");
    if (!name || !name.trim()) return;

    try {
      await createFolder(name.trim(), null); // root
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || "Failed to create folder");
    }
  }

  function handleUploadClick() {
    setOpen(false);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadFile(file, null); // root
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <aside
      style={{
        width: 280,
        height: "100vh",
        background: "rgba(0,0,0,0.20)",
        borderRight: "2px solid var(--border-color)",
        padding: 18,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Cloud size={34} color="#4facfe" />
        <div style={{ fontSize: 18, fontWeight: 800 }}>DriveClone</div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* New button + dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 16,
            border: "2px solid var(--border-color)",
            background: "white",
            color: "#111",
            cursor: "pointer",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Plus size={20} />
          New
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 0,
              width: "100%",
              background: "rgba(15,15,15,0.98)",
              border: "2px solid var(--border-color)",
              borderRadius: 14,
              overflow: "hidden",
              zIndex: 9999,
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            }}
          >
            <button
              onClick={handleCreateFolder}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                color: "var(--text-color)",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FolderPlus size={18} />
              New Folder
            </button>

            <div style={{ height: 1, background: "var(--border-color)", opacity: 0.7 }} />

            <button
              onClick={handleUploadClick}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                color: "var(--text-color)",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Upload size={18} />
              Upload File
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => (
          <NavItem
            key={it.path}
            {...it}
            active={pathname === it.path}
            onClick={() => nav(it.path)}
          />
        ))}
      </nav>

      <div style={{ marginTop: "auto", opacity: 0.55, fontSize: 12 }}>
        Version: ex4 UI
      </div>
    </aside>
  );
}