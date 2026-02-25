import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {Plus, HardDrive, Users, Clock, Star, Trash2, Cloud, LogOut, FolderPlus, Upload} from 'lucide-react';
import { createFolder, uploadFile, uploadFolder } from '../services/filesService';
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ onDriveRefresh, currentFolderId }) => {
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab =
    location.pathname.includes("/trash") ? "trash" :
    location.pathname.includes("/starred") ? "starred" :
    location.pathname.includes("/shared") ? "shared" : 
    location.pathname.includes("/recent") ? "recent" :"my-drive";
  
  const menuItems = [
    { id: "my-drive", icon: HardDrive, label: "My Drive", to: "/dashboard" },
    { id: "shared", icon: Users, label: "Shared with me", to: "/dashboard/shared-with-me" },
    { id: "recent", icon: Clock, label: "Recent", to: "/dashboard/recent" },
    { id: "starred", icon: Star, label: "Starred", to: "/dashboard/starred" },
    { id: "trash", icon: Trash2, label: "Trash", to: "/dashboard/trash" },
  ];

  async function handleCreateFolder() {
    setOpen(false);
    const name = prompt('Folder name:');
    if (!name) return;

    try {
      await createFolder(name, currentFolderId);
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || 'Failed to create folder');
    }
  }

  function handleUploadFileClick() {
    setOpen(false);
    fileInputRef.current?.click();
  }

  function handleUploadFolderClick() {
    setOpen(false);
    folderInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      await uploadFile(files[0], currentFolderId);
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  }

async function handleFolderSelected(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  try {
    const result = await uploadFolder(files, currentFolderId);
    onDriveRefresh?.();

    if (result?.failed?.length) {
      console.log("Failed uploads:", result.failed);
      alert(`Uploaded ${result.uploaded} files. Failed: ${result.failed.length} (see console)`);
    } else {
      alert(`Uploaded ${result?.uploaded ?? "all"} files successfully`);
    }
  } catch (err) {
    alert(err.message || "Upload folder failed");
  } finally {
    e.target.value = "";
  }
}


  return (
    <div
      style={{
        width: '280px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        color: 'var(--text-color)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 10px 30px 10px' }}>
        <Cloud size={38} color="#4facfe" />
        <span style={{ fontSize: '1.6rem', fontWeight: '700' }}>DriveClone</span>
      </div>

      {/* Hidden input: upload single file */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Hidden input: upload folder (Chrome/Edge) */}
      <input
        type="file"
        ref={folderInputRef}
        style={{ display: 'none' }}
        multiple
        {...{ webkitdirectory: "true", directory: "true" }}
        onChange={handleFolderSelected}
      />

      {/* NEW button + dropdown */}
      <div style={{ position: 'relative', marginBottom: '25px', width: 'fit-content' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: 'white',
            color: '#333',
            border: 'none',
            borderRadius: '20px',
            padding: '16px 28px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            width: 'fit-content',
          }}
        >
          <Plus size={28} color="#0c0100" />
          <span>New</span>
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              left: 0,
              zIndex: 9999,
              background: '#1a2327',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              minWidth: 220,
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handleCreateFolder}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <FolderPlus size={18} />
              New Folder
            </button>

            <div style={{ height: 1, background: 'var(--border-color)' }} />

            <button
              onClick={handleUploadFileClick}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Upload size={18} />
              Upload File
            </button>

            <div style={{ height: 1, background: 'var(--border-color)' }} />

            <button
              onClick={handleUploadFolderClick}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#e0e0e0',
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Upload size={18} />
              Upload Folder
            </button>
          </div>
        )}
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 25px',
              borderRadius: '0 30px 30px 0',
              marginBottom: '10px',
              cursor: 'pointer',
              marginLeft: '-20px',
              paddingLeft: '45px',
              backgroundColor: activeTab === item.id ? 'rgba(79, 172, 254, 0.2)' : 'transparent',
              color: activeTab === item.id ? '#4facfe' : 'inherit',
              borderLeft: activeTab === item.id ? '4px solid #4facfe' : '4px solid transparent',
            }}
          >
            <item.icon size={22} />
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'transparent',
            border: 'none',
            color: '#ff7675',
            cursor: 'pointer',
            padding: '12px',
            width: '100%',
            fontSize: '1rem',
          }}
        >
          <LogOut size={20} /> Logout 
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
