import { apiClient } from "./apiClient";

// update by port (node-server)
const ENDPOINTS = {
  list: "/api/files",
};

function normalizeType(raw) {
  const t = String(raw ?? "").toLowerCase();
  if (["folder", "dir", "directory"].includes(t)) return "folder";
  if (["file"].includes(t)) return "file";
  return "file";
}

function normalizeItem(raw) {
  return {
    id: raw.id ?? raw._id ?? raw.fileId,
    name: raw.name ?? raw.filename ?? raw.title,
    type: normalizeType(raw.type ?? raw.kind ?? (raw.isFolder ? "folder" : "file")),
    parentId:raw.parentId ?? raw.parent ?? raw.parent_id ?? raw.parentFolderId ?? null,
    size: raw.size ?? raw.bytes ?? null,
    createdAt: raw.createdAt ?? raw.created ?? null,
    starred: Boolean(raw.starred ?? raw.isStarred ?? false),
    trashed: Boolean(raw.trashed ?? raw.isTrashed ?? false),
  };
}

export async function listFiles() {
  const data = await apiClient.get(ENDPOINTS.list);
  const items = Array.isArray(data) ? data : (data.files ?? data.items ?? []);
  return items.map(normalizeItem);
}

export async function createFolder(name, parentId = null) {
  const data = await apiClient.post("/api/files", {
    name,
    type: "folder",
    parentId
  });
  // if apiclinet return the body of response
  return data; // { id }
}

function fileToBase64Raw(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFile(file, parentId = null) {
  const base64 = await fileToBase64Raw(file);

  return apiClient.post("/api/files", {
    name: file.name,
    type: "file",
    parentId,
    content: base64,
    mime: file.type || "application/octet-stream",
    encoding: "base64",
    size: file.size,
  });
}

export async function uploadFolder(fileList, parentId = null) {
  const files = Array.from(fileList || []);
  if (files.length === 0) return;

  // root/sub1/sub2/file.txt
  const firstRel = files[0].webkitRelativePath || "";
  const rootName = firstRel.split("/")[0];
  if (!rootName) throw new Error("Folder selection not detected");

  // 1) create folder
  const rootRes = await createFolder(rootName, parentId);
  const rootId = rootRes?.id ?? rootRes?._id ?? rootRes?.file?.id ?? rootRes?.file?._id;
  if (!rootId) {
    console.error("createFolder response:", rootRes);
    throw new Error("Server did not return folder id");
  }
  // Map: "root/sub" -> folderId
  const folderIdByPath = new Map();
  folderIdByPath.set(rootName, rootId);

  // 2) create all the folders by deep levels
  const folderPaths = new Set();

  for (const f of files) {
    const rel = f.webkitRelativePath;
    if (!rel) continue;
    const parts = rel.split("/"); // [root, sub1, sub2, file]
    for (let i = 1; i < parts.length - 1; i++) {
      const path = parts.slice(0, i + 1).join("/");
      folderPaths.add(path);
    }
  }

  // create by the length
  const sortedFolderPaths = Array.from(folderPaths).sort(
    (a, b) => a.split("/").length - b.split("/").length
  );

  for (const path of sortedFolderPaths) {
    const parts = path.split("/");
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const parentFolderId = folderIdByPath.get(parentPath);

    const res = await createFolder(name, parentFolderId);
    const fid = res?.id ?? res?._id ?? res?.file?.id ?? res?.file?._id;
    if (!fid) {
      console.error("createFolder response:", res);
      throw new Error("Server did not return folder id");
    }
    folderIdByPath.set(path, fid);
  }

  const failed = [];
  let uploaded = 0;

  for (const f of files) {
    const rel = f.webkitRelativePath;
    if (!rel) continue;

    const parts = rel.split("/");
    const parentPath = parts.slice(0, -1).join("/");
    const targetParentId = folderIdByPath.get(parentPath) || rootId;

    try {
      await uploadFile(f, targetParentId);
      uploaded++;
    } catch (e) {
      failed.push({ name: f.name, path: rel, error: e?.message || String(e) });
    }
  }

  return { rootId, rootName, uploaded, failed };
}

export async function getFileById(id) {
  const data = await apiClient.get(`/api/files/${id}`);
  return {
    ...data,
    content: data.content || null,
    mime: data.mime || "application/octet-stream",
  };
}

export async function deleteFile(id) {
  return apiClient.delete(`/api/files/${id}`);
}

export async function moveToTrash(id) {
  return apiClient.patch(`/api/files/${id}/trash`, { trashed: true });
}

export async function listStarred() {
  const data = await apiClient.get("/api/files?starred=true");
  const items = Array.isArray(data) ? data : (data.files ?? data.items ?? []);
  return items.map(normalizeItem);
}

export async function hardDeleteFile(id) {
  return apiClient.delete(`/api/files/${id}`);
}
