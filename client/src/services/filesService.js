import { apiClient } from "./apiClient";

// update by port (node-server)
const ENDPOINTS = {
  list: "/api/files",
};

function normalizeItem(raw) {
  return {
    id: raw.id ?? raw._id ?? raw.fileId,
    name: raw.name ?? raw.filename ?? raw.title,
    type: raw.type ?? raw.kind ?? (raw.isFolder ? "folder" : "file"),
    size: raw.size ?? raw.bytes ?? null,
    createdAt: raw.createdAt ?? raw.created ?? null,
  };
}

export async function listFiles() {
  const data = await apiClient.get(ENDPOINTS.list);
  const items = Array.isArray(data) ? data : (data.files ?? data.items ?? []);
  return items.map(normalizeItem);
}

export async function createFolder(name) {
  return apiClient.post("/api/files", {
    name,
    type: "folder",
    isFolder: true,
  });
}


function fileToBase64Raw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result; 
      // data:text/plain;base64,SGVsbG8=
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64.replace(/\s/g, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file) {
  const safeContent = `uploaded_${Date.now()}`;

  return apiClient.post("/api/files", {
    name: file.name,
    type: "file",
    content: safeContent,
  });
}

