import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, FileText, Download, Trash2, Share2, Star } from 'lucide-react';

const FileActionMenu = ({ file, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action, e) => {
    e.stopPropagation();
    setIsOpen(false);
    onAction(action, file);
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <MoreHorizontal size={22} color="var(--text-color)" opacity={0.8} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: '100%', 
          right: 0, 
          zIndex: 100,
          backgroundColor: '#1e1e1e', 
          border: '1px solid #333',
          borderRadius: '12px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', 
          minWidth: '220px', 
          padding: '8px',
          marginTop: '5px'
        }}>
          
          <div onClick={(e) => handleAction('open', e)} style={menuItemStyle}>
            <FileText size={18} /> <span>Open</span>
          </div>
          
          {file.type !== 'folder' && (
            <div onClick={(e) => handleAction('download', e)} style={menuItemStyle}>
              <Download size={18} /> <span>Download</span>
            </div>
          )}

          <div onClick={(e) => handleAction('star', e)} style={menuItemStyle}>
            <Star size={18} /> <span>{file.starred ? "Remove from Starred" : "Add to Starred"}</span>
          </div>

          <div onClick={(e) => handleAction('share', e)} style={menuItemStyle}>
            <Share2 size={18} /> <span>Share</span>
          </div>

          <div style={{ borderTop: '1px solid #333', margin: '8px 0' }}></div>

          <div onClick={(e) => handleAction('delete', e)} style={{ ...menuItemStyle, color: '#ff7675' }}>
            <Trash2 size={18} /> <span>Delete</span>
          </div>
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px',
  padding: '12px 16px', 
  cursor: 'pointer', 
  fontSize: '0.95rem',
  color: '#e0e0e0', 
  transition: 'background 0.2s', 
  borderRadius: '8px',
  fontWeight: 500
};

export default FileActionMenu;