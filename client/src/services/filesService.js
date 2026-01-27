import { apiClient } from "./apiClient";

const ENDPOINTS = {
  list: "/api/files",
};

function normalizeItem(raw) {
  return {
    id: raw.id ?? raw._id ?? raw.fileId,
    name: raw.name ?? raw.filename ?? raw.title,
    type: raw.type ?? raw.kind ?? (raw.isFolder ? "dir" : "file"),
    size: raw.size ?? raw.bytes ?? null,

    createdAt: raw.createdAt ?? raw.created ?? null,
    updatedAt: raw.updatedAt ?? raw.updated ?? null,
    parentId: raw.parentId ?? raw.parent ?? null,

    deletedAt: raw.deletedAt ?? null,

    // ✅ ADD THIS
    starredAt: raw.starredAt ?? null,

    // ✅ optional but good to have
    ownerId: raw.ownerId ?? null,

    permissions: raw.permissions ?? [],

    content: raw.content ?? null,
    encoding: raw.encoding ?? null,
    mimeType: raw.mimeType ?? raw.mimetype ?? null,
  };
}

function normalizeList(data) {
  const items = Array.isArray(data) ? data : data?.files ?? data?.items ?? [];
  return items.map(normalizeItem);
}

/** ✅ GET /api/files */
export async function listFiles() {
  const data = await apiClient.get(ENDPOINTS.list);
  return normalizeList(data);
}

/** ✅ GET /api/files?deleted=1 */
export async function listTrash() {
  const data = await apiClient.get("/api/files?deleted=1");
  return normalizeList(data);
}

/** ✅ POST /api/files (dir) */
export async function createFolder(name, parentId = null) {
  return apiClient.post("/api/files", {
    name,
    type: "dir",
    parentId,
  });
}

function fileToBase64Raw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64.replace(/\s/g, ""));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** ✅ POST /api/files (upload file) */
export async function uploadFile(file, parentId = null) {
  const name = file.name;
  const lower = name.toLowerCase();

  const payload = {
    name,
    type: "file",
    parentId,
  };

  // ✅ TEXT FILES
  if (
    file.type.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    payload.content = await file.text();
    payload.encoding = "text";
    payload.mimeType = file.type || "text/plain";
  }

  // ✅ PDF → base64
  else if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    payload.content = await fileToBase64Raw(file);
    payload.encoding = "base64";
    payload.mimeType = "application/pdf";
  }

  // ✅ fallback → base64
  else {
    payload.content = await fileToBase64Raw(file);
    payload.encoding = "base64";
    payload.mimeType = file.type || "application/octet-stream";
  }

  return apiClient.post("/api/files", payload);
}

/** ✅ GET /api/search/:query */
export async function searchFiles(query) {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());

  const data = await apiClient.get(`/api/search/${q}`);
  return normalizeList(data);
}

/** ✅ GET /api/files/:id */
export async function getFile(fileId) {
  if (!fileId) throw new Error("Missing fileId");
  const data = await apiClient.get(`/api/files/${fileId}`);
  return normalizeItem(data);
}

/** ✅ DELETE /api/files/:id  (soft delete אצלך) */
export async function deleteFile(fileId) {
  if (!fileId) throw new Error("Missing fileId");
  return apiClient.del(`/api/files/${fileId}`);
}

/** ✅ PATCH /api/files/:id/restore */
export async function restoreFile(fileId) {
  if (!fileId) throw new Error("Missing fileId");
  const data = await apiClient.patch(`/api/files/${fileId}/restore`);
  return normalizeItem(data);
}
export async function hardDeleteFile(fileId) {
  return apiClient.del(`/api/files/${fileId}/hard`);
}
export async function listStarred() {
  const data = await apiClient.get("/api/files?starred=1");
  const items = Array.isArray(data) ? data : [];
  return items.map(normalizeItem);
}

export async function starFile(fileId) {
  const data = await apiClient.patch(`/api/files/${fileId}/star`, {});
  return normalizeItem(data);
}

export async function unstarFile(fileId) {
  const data = await apiClient.patch(`/api/files/${fileId}/unstar`, {});
  return normalizeItem(data);
}

export async function listSharedWithMe() {
  const data = await apiClient.get("/api/files?shared=1");
  return normalizeList(data);
}