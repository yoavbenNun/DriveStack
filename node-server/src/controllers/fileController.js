// node-server/src/controllers/fileController.js

const TcpClient = require("../services/TcpClient");
const FileModel = require("../models/file.model");
const { v4: uuidv4 } = require("uuid");

// C++ server
const CPP_PORT = process.env.CPP_PORT || 8080;
const CPP_HOST = process.env.CPP_HOST || "localhost";

// ------------------------
// ✅ Helpers
// ------------------------

function normalizeType(type) {
  return type === "dir" ? "dir" : "file";
}

// ✅ Get userId from auth middleware OR from x-user-id header (fallback)
function getUserId(req) {
  if (req.user?.id) return req.user.id;
  const headerId = req.headers["x-user-id"];
  if (headerId) return headerId;
  return null;
}

// ✅ owner-only helper
function isOwner(file, userId) {
  return !!file && !!userId && file.ownerId === userId;
}

// ✅ access helper (owner OR permission)
function hasAccess(file, userId) {
  if (!file || !userId) return false;
  if (file.ownerId === userId) return true;

  const perms = Array.isArray(file.permissions) ? file.permissions : [];
  return perms.some((p) => p?.holderId === userId || p?.userId === userId);
}

// ✅ get permission object for user (non-owner)
function getUserPermission(file, userId) {
  if (!file || !userId) return null;
  if (file.ownerId === userId) return { type: "owner", holderId: userId };

  const perms = Array.isArray(file.permissions) ? file.permissions : [];
  return (
    perms.find((p) => p?.holderId === userId || p?.userId === userId) || null
  );
}

function canRead(file, userId) {
  return hasAccess(file, userId);
}

function canWrite(file, userId) {
  if (!file || !userId) return false;
  if (file.ownerId === userId) return true;
  const p = getUserPermission(file, userId);
  return p?.type === "write" || p?.type === "owner";
}

// ✅ helper: collect root + all descendants (only within same owner list)
function collectRecursively(allFiles, rootId) {
  const result = [];
  const stack = [rootId];

  while (stack.length) {
    const curId = stack.pop();

    const node = allFiles.find((x) => x.id === curId);
    if (!node) continue;

    result.push(node);

    const children = allFiles.filter((x) => x.parentId === curId);
    for (const c of children) stack.push(c.id);
  }

  return result;
}

// ------------------------
// ✅ GET /api/files
// default: only active (not deleted)
// Trash list: /api/files?deleted=1
// Starred list: /api/files?starred=1
// Shared list: /api/files?shared=1
// ------------------------
exports.getAllFiles = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const onlyDeleted = req.query.deleted === "1" || req.query.deleted === "true";
  const onlyStarred = req.query.starred === "1" || req.query.starred === "true";
  const onlyShared = req.query.shared === "1" || req.query.shared === "true";

  const all = FileModel.getAll();

  // ✅ SHARED WITH ME (לא שלי!)
  if (onlyShared) {
    const shared = all.filter((f) => {
      if (f.deletedAt) return false;
      if (f.ownerId === userId) return false;
      return hasAccess(f, userId);
    });

    return res.status(200).json(shared);
  }

  // ✅ MY DRIVE
  const myFiles = all.filter((f) => f.ownerId === userId);

  let filtered = onlyDeleted
    ? myFiles.filter((f) => f.deletedAt)
    : myFiles.filter((f) => !f.deletedAt);

  if (onlyStarred) {
    filtered = filtered.filter((f) => !!f.starredAt && !f.deletedAt);
  }

  return res.status(200).json(filtered);
};

// ------------------------
// ✅ GET /api/files/:id
// Allow: owner OR shared permission
// ------------------------
exports.getFileById = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta || !hasAccess(meta, userId)) {
    return res.status(404).json({ error: "File not found" });
  }

  // ✅ load content only for "file"
  if (meta.type === "file") {
    const client = new TcpClient(CPP_PORT, CPP_HOST);

    try {
      const response = await client.send(`GET ${id}`);

      if (response.startsWith("404")) {
        return res
          .status(404)
          .json({ error: "File content not found on storage" });
      }

      const parts = response.split("\n\n");
      const body = parts.length > 1 ? parts.slice(1).join("\n\n") : "";

      return res.status(200).json({
        ...meta,
        content: body,
      });
    } catch (e) {
      return res.status(500).json({ error: "Storage server error" });
    }
  }

  return res.status(200).json(meta);
};

// ------------------------
// ✅ POST /api/files
// Owner only (creates in user's drive)
// ------------------------
exports.createFileOrDir = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const { name, type, parentId, content } = req.body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  // ✅ validate parentId belongs to same user
  if (parentId) {
    const parent = FileModel.findById(parentId);
    if (!parent || parent.ownerId !== userId || parent.type !== "dir") {
      return res.status(400).json({ error: "Invalid parentId" });
    }
  }

  const id = uuidv4();
  const t = normalizeType(type);
  const now = new Date().toISOString();

  // if file -> create in C++ storage
  if (t === "file") {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = content || "";
      await client.send(`POST ${id} ${encodedContent}`);
    } catch (e) {
      return res
        .status(500)
        .json({ error: "Failed to create file on storage server" });
    }
  }

  FileModel.create({
    id,
    name: name.trim(),
    type: t,
    parentId: parentId || null,

    ownerId: userId,

    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    starredAt: null,
    permissions: [],
  });

  res.setHeader("Location", `/api/files/${id}`);
  return res.status(201).end();
};

// ------------------------
// ✅ PATCH /api/files/:id
// OWNER ONLY (rename / meta updates)
// ------------------------
exports.updateFileById = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  // ✅ IMPORTANT: only owner can rename/update
  if (!meta || !isOwner(meta, userId)) {
    return res.status(403).json({ error: "Only owner can update this file" });
  }

  const { name } = req.body || {};
  if (name) {
    meta.name = name;
    meta.updatedAt = new Date().toISOString();
  }

  FileModel.save(meta);
  return res.status(204).end();
};

// ------------------------
// ✅ DELETE /api/files/:id
// OWNER ONLY (soft delete)
// ------------------------
exports.deleteFileById = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) return res.status(404).json({ error: "File not found" });

  // ✅ רק הבעלים יכול למחוק
  if (meta.ownerId !== userId) {
    return res.status(403).json({ error: "Only owner can delete this file" });
  }

  meta.deletedAt = new Date().toISOString();
  meta.updatedAt = meta.deletedAt;

  FileModel.save(meta);
  return res.status(204).end();
};
// ------------------------
// ✅ PATCH /api/files/:id/restore
// OWNER ONLY
// ------------------------
exports.restoreFileById = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  // ✅ IMPORTANT: only owner can restore
  if (!meta || !isOwner(meta, userId)) {
    return res.status(403).json({ error: "Only owner can restore this file" });
  }

  meta.deletedAt = null;
  meta.updatedAt = new Date().toISOString();

  FileModel.save(meta);
  return res.status(200).json(meta);
};

// ------------------------
// ✅ GET /api/search/:query
// Owner-only search (your original)
// NOTE: does NOT include shared files
// ------------------------
exports.searchFiles = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const query = req.params.query;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  const allFiles = FileModel.getAll().filter((f) => f.ownerId === userId);
  const activeFiles = allFiles.filter((f) => !f.deletedAt);

  // name match
  const nameMatches = activeFiles.filter(
    (file) => file.name && file.name.includes(query)
  );

  // storage content search
  let contentMatches = [];
  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const response = await client.send(`SEARCH ${query}`);

    if (!response.startsWith("404") && response.includes("\n\n")) {
      const parts = response.split("\n\n");
      if (parts.length > 1) {
        const ids = parts[1]
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean);

        contentMatches = ids
          .map((id) => FileModel.findById(id))
          .filter((f) => f && f.ownerId === userId && !f.deletedAt);
      }
    }
  } catch (error) {
    console.log("Content search warning:", error.message);
  }

  // merge unique
  const combined = [...nameMatches];
  contentMatches.forEach((file) => {
    if (!combined.find((x) => x.id === file.id)) combined.push(file);
  });

  return res.status(200).json(combined);
};

// ------------------------
// ✅ DELETE /api/files/:id/hard
// OWNER ONLY (delete forever)
// ------------------------
exports.hardDeleteFileById = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const { id } = req.params;

  const meta = FileModel.findById(id);

  // ✅ IMPORTANT: only owner can hard delete
  if (!meta || !isOwner(meta, userId)) {
    return res.status(403).json({ error: "Only owner can hard delete this file" });
  }

  // only user's files
  const allFiles = FileModel.getAll().filter((f) => f.ownerId === userId);

  // root + all children
  const toDelete = collectRecursively(allFiles, id);

  // delete physical files (best-effort)
  const client = new TcpClient(CPP_PORT, CPP_HOST);
  for (const item of toDelete) {
    if (item.type === "file") {
      try {
        await client.send(`DELETE ${item.id}`);
      } catch (e) {
        console.log("C++ DELETE failed:", item.id, e.message);
      }
    }
  }

  // remove metadata completely
  for (const item of toDelete) {
    FileModel.remove(item.id);
  }

  return res.status(204).end();
};

// ------------------------
// ⭐ PATCH /api/files/:id/star
// OWNER ONLY (כי זה שדה על הקובץ עצמו)
// ------------------------
exports.starFileById = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  // ✅ IMPORTANT: only owner can star
  if (!meta || !isOwner(meta, userId)) {
    return res.status(403).json({ error: "Only owner can star this file" });
  }

  meta.starredAt = new Date().toISOString();
  meta.updatedAt = meta.starredAt;

  FileModel.save(meta);
  return res.status(200).json(meta);
};

// ------------------------
// ⭐ PATCH /api/files/:id/unstar
// OWNER ONLY
// ------------------------
exports.unstarFileById = (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Missing user id" });

  const id = req.params.id;
  const meta = FileModel.findById(id);

  // ✅ IMPORTANT: only owner can unstar
  if (!meta || !isOwner(meta, userId)) {
    return res.status(403).json({ error: "Only owner can unstar this file" });
  }

  meta.starredAt = null;
  meta.updatedAt = new Date().toISOString();

  FileModel.save(meta);
  return res.status(200).json(meta);
};