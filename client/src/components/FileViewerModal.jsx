import React, { useState, useEffect } from 'react';
import { X, Save, Download } from 'lucide-react';

const FileViewerModal = ({ file, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ext = file.name.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isText = ['txt', 'js', 'html', 'css', 'json', 'md', 'cpp', 'h'].includes(ext);
  
  const fileUrl = `http://localhost:3000/api/files/${file.id}/download`; 

  useEffect(() => {
    if (isText) {
      fetch(`${fileUrl}?t=${Date.now()}`)
        .then(res => res.text())
        .then(text => { setContent(text); setIsEditable(true); })
        .catch(err => setContent("Error loading content (Backend might be missing download route)"));
    }
  }, [file, isText, fileUrl]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      const response = await fetch(`http://localhost:3000/api/files/${file.id}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: base64Content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save file');
      }

      alert("File saved successfully!");
      if (onSave) onSave(); 

    } catch (error) {
      console.error(error);
      alert("Error saving file: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        width: '80%', height: '85%', background: '#1e1e1e', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
          <strong>{file.name}</strong>
          <div style={{ display: 'flex', gap: '15px' }}>
            {isEditable && <button onClick={handleSave}><Save size={20}/></button>}
            <button onClick={() => window.open(fileUrl)}><Download size={20}/></button>
            <button onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          {isImage && <img src={fileUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
          
          {isText && (
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', height: '100%', background: '#111', color: '#ccc', border: 'none', resize: 'none' }}
            />
          )}

          {!isImage && !isText && (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <h3>No preview available</h3>
              <button onClick={() => window.open(fileUrl)}>Download File</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;