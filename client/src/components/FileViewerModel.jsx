import React, { useState, useEffect } from 'react';
import { X, Save, Download } from 'lucide-react';
import { downloadFileContent, updateFileContent } from '../services/filesService';

const FileViewerModel = ({ file, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ext = file.name.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isText = ['txt', 'js', 'html', 'css', 'json', 'md', 'cpp', 'h'].includes(ext);
  
  const fileUrl = `http://localhost:3000/api/files/${file.id}/download`; 

  useEffect(() => {
    if (isText) {
      downloadFileContent(file.id)
        .then(res => {
          console.log("Full response:", res);
          console.log("Type of data:", typeof res.data);
          setContent(res.data || res); 
          setIsEditable(true); 
        })
        .catch(err => {
          console.error(err);
          setContent("Error loading content: " + (err.response?.data?.error || err.message));
        });
      }
  }, [file.id, isText]);
    

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const base64Content = btoa(unescape(encodeURIComponent(content)));

      await updateFileContent(file.id, base64Content);

      alert("File content updated successfully!");
      if (onSave) onSave();

    } catch (error) {
        console.error("Error updating file content:", error);
        alert("Failed to update file content: " + (error.response?.data?.error || error.message));
      } finally  {
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

export default FileViewerModel;