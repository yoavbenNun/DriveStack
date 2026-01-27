import React, { useRef } from "react";

export default function FilesToolbar({
  viewMode,
  onToggle,
  onRefresh,
  onNewFolder,
  onUploadFile,
  currentFolderName,
}) {
  const fileInputRef = useRef(null);

  function triggerUpload() {
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    await onUploadFile?.(file);

    // allow uploading same file again
    e.target.value = "";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 16px",
        borderRadius: 18,
        border: "2px solid var(--border-color)",
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>
          {currentFolderName || "My Drive"}
        </div>
        <div style={{ opacity: 0.55, fontSize: 13 }}>
          ({viewMode === "grid" ? "Grid" : "List"})
        </div>
      </div>

      {/* Right side actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onNewFolder}
          style={btnStyle()}
          title="Create Folder"
        >
          📁 New Folder
        </button>

        <button onClick={triggerUpload} style={btnStyle()} title="Upload File">
          ⬆️ Upload
        </button>

        <button onClick={onRefresh} style={btnStyle()} title="Refresh">
          🔄 Refresh
        </button>

        <button onClick={onToggle} style={btnStyle()} title="Toggle View">
          {viewMode === "grid" ? "📃 List" : "🔲 Grid"}
        </button>

        {/* hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChosen}
        />
      </div>
    </div>
  );
}

function btnStyle() {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: "2px solid var(--border-color)",
    background: "transparent",
    color: "var(--text-color)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  };
}
