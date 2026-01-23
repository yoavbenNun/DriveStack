import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, HardDrive, Users, Clock, Star, Trash2, Cloud, LogOut, FolderPlus, Upload } from 'lucide-react';
import { createFolder, uploadFile } from '../services/filesService';

const Sidebar = ({ onDriveRefresh }) => {
  const { logout, user } = useAuth();
  const activeTab = 'my-drive';
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const menuItems = [
    { id: 'my-drive', icon: HardDrive, label: 'My Drive' },
    { id: 'shared', icon: Users, label: 'Shared with me' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'starred', icon: Star, label: 'Starred' },
    { id: 'trash', icon: Trash2, label: 'Trash' },
  ];

  async function handleCreateFolder() {
    setOpen(false);
    const name = prompt('Folder name:');
    if (!name) return;

    try {
      await createFolder(name);
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || 'Failed to create folder');
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
      await uploadFile(file);
      onDriveRefresh?.();
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      e.target.value = '';
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

      {/* Hidden input (useRef requirement) */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
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
              background: 'var(--sidebar-bg)',
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
                color: 'inherit',
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
              onClick={handleUploadClick}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
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
          </div>
        )}
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
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
          <LogOut size={20} /> Logout {user?.username}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
