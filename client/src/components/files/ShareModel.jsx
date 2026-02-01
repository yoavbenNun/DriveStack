import { useEffect, useState } from "react";
import { addPermission, listPermissions, deletePermission } from "../../services/permissionsService";

export default function ShareModel({ open, file, onClose }) {
  const [holderId, setHolderId] = useState("");
  const [type, setType] = useState("read"); // read | write
  const [loading, setLoading] = useState(false);

  const [perms, setPerms] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);

  async function refreshPerms() {
    if (!file?.id) return;
    setPermsLoading(true);
    try {
      const data = await listPermissions(file.id);
      const arr = Array.isArray(data) ? data : [];
      setPerms(arr);
    } catch {
      setPerms([]);
    } finally {
      setPermsLoading(false);
    }
  }

  useEffect(() => {
    if (open && file?.id) {
      setHolderId("");
      setType("read");
      refreshPerms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file?.id]);

  async function handleShare() {
    if (!file?.id) return;
    if (!holderId.trim()) return alert("Enter user id");

    setLoading(true);
    try {
      await addPermission(file.id, { type, holderId: holderId.trim() });
      setHolderId("");
      await refreshPerms();
    } catch (e) {
      alert(e.message || "Share failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemovePermission(permId) {
    if (!file?.id || !permId) return;
    try {
      await deletePermission(file.id, permId);
      await refreshPerms();
    } catch (e) {
      alert(e.message || "Remove permission failed");
    }
  }

  if (!open || !file) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 92vw)",
          background: "var(--card-bg)",
          border: "2px solid var(--border-color)",
          borderRadius: 16,
          padding: 16,
          color: "var(--text-color)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Share</div>
            <div style={{ opacity: 0.75, wordBreak: "break-word" }}>{file.name}</div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "2px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-color)",
              borderRadius: 12,
              padding: "8px 10px",
              cursor: "pointer",
              height: 40,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <input
            value={holderId}
            onChange={(e) => setHolderId(e.target.value)}
            placeholder="User ID to share with"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 12,
              border: "2px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-color)",
              outline: "none",
            }}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "2px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-color)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="read">read</option>
            <option value="write">write</option>
          </select>

          <button
            onClick={handleShare}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "var(--accent, #4facfe)",
              color: "white",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sharing..." : "Share"}
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, opacity: 0.9 }}>
            People with access
          </div>

          {permsLoading ? (
            <div style={{ opacity: 0.75 }}>Loading permissions...</div>
          ) : perms.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No one yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {perms.map((p) => (
                <div
                  key={p.pId || p.id || p._id || `${p.holderId}-${p.type}`}
                  style={{
                    border: "2px solid var(--border-color)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, wordBreak: "break-all" }}>
                      {p.holderId || p.userId}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: 13 }}>{p.type}</div>
                  </div>

                  <button
                    onClick={() => handleRemovePermission(p.pId || p.id || p._id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "none",
                      background: "#ff3b30",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}