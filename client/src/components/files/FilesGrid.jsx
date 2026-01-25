import React from 'react';
import { Folder, FileText, FileImage, FileCode, File } from "lucide-react";
import FileActionMenu from './FileActionMenu';

export default function FileGrid({ items, onAction }) {

  // chooses icon based on file type
  const getFileIcon = (it) => {
    const isFolder = it.type === "folder" || !it.name.includes('.');
    
    if (isFolder) {
      return <Folder size={64} color="#74b9ff" fill="#74b9ff" style={{ fillOpacity: 0.2 }} />;
    }

    const ext = it.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage size={64} color="#a78bfa" />;
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'cpp', 'h'].includes(ext)) return <FileCode size={64} color="#60a5fa" />;
    
    // default file icon
    return <FileText size={64} color="#9ca3af" />;
  };

  return (
    <div style={{ 
      display: 'grid', 
      // creates a responsive grid - adjusts column count based on screen width
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
      gap: '15px', 
      padding: '20px 20px 80px 40px' 
    }}>
      {items.map((it) => (
        <div
          key={it.id}
          onDoubleClick={() => onAction && onAction('open', it)}
          style={{
            position: 'relative', // important for positioning the menu in the corner
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            height: '180px', // fixed height for each card
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        >
          {/* menu location */}
          <div 
            style={{ position: 'absolute', top: 10, right: 10 }} 
            onClick={(e) => e.stopPropagation()} 
          >
            <FileActionMenu file={it} onAction={onAction} />
          </div>

          {/* Big center Icon */}
          <div style={{ marginBottom: '15px' }}>
            {getFileIcon(it)}
          </div>

          {/* file name */}
          <div style={{ 
            padding: '0 10px',
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '18px',
            color: '#e0e0e0'
          }}>
            {it.name}
          </div>
        </div>
      ))}
    </div>
  );
}