function guessMime(name = "") {
    const lower = name.toLowerCase();
    if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv"))
      return "text/plain";
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".gif")) return "image/gif";
    return null;
  }
  
  function isProbablyText(str) {
    if (typeof str !== "string") return false;
    const weird = str.match(/[^\x09\x0A\x0D\x20-\x7E]/g);
    return !weird || weird.length < 5;
  }
  
  export default function FileViewerModel({ openFile, onClose }) {
    if (!openFile) return null;
  
    const mime = openFile.mimeType ?? guessMime(openFile.name);
    const encoding =
      openFile.encoding ?? (mime?.startsWith("text/") ? "text" : null);
  
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: "min(900px, 92vw)",
            height: "min(700px, 85vh)",
            background: "#111",
            color: "#fff",
            borderRadius: 16,
            padding: 16,
            overflow: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>{openFile.name}</h2>
              <div style={{ opacity: 0.7, fontSize: 14 }}>
                {openFile.type} • {openFile.id}
              </div>
            </div>
  
            <button
              onClick={onClose}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #444",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
  
          <hr style={{ opacity: 0.2, margin: "12px 0" }} />
  
          {/* Metadata */}
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 10 }}>
            <div>
              <b>Created:</b> {openFile.createdAt || "-"}
            </div>
            <div>
              <b>Updated:</b> {openFile.updatedAt || "-"}
            </div>
            <div>
              <b>Mime:</b> {mime || "-"}
            </div>
            <div>
              <b>Encoding:</b> {openFile.encoding ?? (mime?.startsWith("text/") ? "text" : "-")}
            </div>
          </div>
  
          <hr style={{ opacity: 0.2, margin: "12px 0" }} />
  
          {/* Content */}
          {openFile.content ? (
            <>
              {/* TEXT */}
              {encoding === "text" ||
              mime?.startsWith("text/") ||
              isProbablyText(openFile.content) ? (
                <pre style={{ whiteSpace: "pre-wrap" }}>{openFile.content}</pre>
              ) : null}
  
              {/* IMAGE */}
              {mime?.startsWith("image/") ? (
                <img
                  style={{ maxWidth: "100%", borderRadius: 12 }}
                  src={`data:${mime};base64,${openFile.content}`}
                  alt={openFile.name}
                />
              ) : null}
  
              {/* PDF */}
              {mime === "application/pdf" ? (
                <iframe
                  title="pdf"
                  style={{
                    width: "100%",
                    height: "520px",
                    border: "none",
                    borderRadius: 12,
                  }}
                  src={`data:application/pdf;base64,${openFile.content}`}
                />
              ) : null}
  
              {/* UNKNOWN */}
              {!(
                encoding === "text" ||
                mime?.startsWith("text/") ||
                isProbablyText(openFile.content) ||
                mime?.startsWith("image/") ||
                mime === "application/pdf"
              ) ? (
                <div style={{ opacity: 0.8 }}>
                  File content exists but cannot preview this type.
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ opacity: 0.7 }}>No content returned from server</div>
          )}
        </div>
      </div>
    );
  }