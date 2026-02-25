// web-server/src/controllers/fileController.js
const TcpClient = require('../services/TcpClient');
const FileModel = require('../models/file.model'); 
const { v4: uuidv4 } = require('uuid');

// C++ server
const CPP_PORT = process.env.CPP_PORT || 8080; 
const CPP_HOST = process.env.CPP_HOST || 'localhost';

const jwt = require('jsonwebtoken');
const  SECRET_KEY = 'my_secret_key_123'; // In production, use a secure environment variable

function normalizeType(type) {
  const t = String(type ?? "").toLowerCase();
  if (["folder", "dir", "directory"].includes(t)) return "folder";
  return "file";
}

function cleanBase64(s) {
  return String(s || "").replace(/\r/g, "").replace(/\s/g, "");
}

// GET /api/files
exports.getAllFiles = (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return res.status(400).json({ error: "Invalid token." });
    }

    const userId = decoded.id; 
    const { starred, trashed, shared } = req.query;
    
    let allFiles;

    if (String(shared) === "true") {
      allFiles = FileModel.getSharedWithUser(userId);
      
      allFiles = allFiles.map(file => ({ ...file, shared: true }));
      
    } else {
      allFiles = FileModel.getAll().filter(f => f.ownerId === userId);
    }

    if (starred !== undefined) {
      const s = String(starred) === "true";
      allFiles = allFiles.filter(f => Boolean(f.starred) === s);
    }

    if (trashed !== undefined) {
      const t = String(trashed) === "true";
      allFiles = allFiles.filter(f => Boolean(f.trashed) === t);
    }

    return res.status(200).json(allFiles);
  } catch (e) {
    console.error("getAllFiles failed:", e);
    return res.status(500).json({ error: e.message || "getAllFiles failed" });
  }
};


// PATCH /api/files/:id
exports.updateFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) {
    return res.status(404).json({ error: "File not found" });
  }

  const { name, parentId, content } = req.body || {};

  if (typeof name === "string" && name.trim() !== "") {
    meta.name = name.trim();
  }

  if (parentId !== undefined) {
    meta.parentId = parentId || null;
  }

  // Update content if provided and it's a file
 if (content !== undefined && meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = cleanBase64(content);

      // delete old content first
      try {
          await client.send(`DELETE ${id}`);
      } catch (delErr) {
          console.warn(`[UPDATE] Warning: Delete failed for ${id}, proceeding to create.`);
      }

      await client.send(`POST ${id} ${encodedContent}`);
      
      meta.size = encodedContent.length; 
      console.log(`[UPDATE] Re-created content for ${id} successfully`);

    } catch (e) {
      console.error("Failed to update content on C++ server:", e.message);
      meta.updatedAt = new Date().toISOString();return res.status(200).json(meta);
      //return res.status(500).json({ error: "Failed to save file content" });
    }
  }
};


// POST /api/files
exports.createFileOrDir = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    userId = decoded.id; 
  } catch (err) {
    return res.status(400).json({ error: "Invalid token." });
  }


  const { name, type, parentId, content, encoding, mime, size } = req.body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "Name is required" });
  }

  const id = uuidv4();
  const t = normalizeType(type);
  const now = new Date().toISOString();

  if (t === "file") {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = cleanBase64(content);
      await client.send(`POST ${id} ${encodedContent}`);
    } catch (e) {
      return res.status(404).json({ error: "Failed to create file on storage server" });
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
    permissions: [],
    mime: mime || null,
    encoding: encoding || null,
    size: typeof size === "number" ? size : null,
  });

  res.setHeader("Location", `/api/files/${id}`);
  return res.status(201).json({ id }); //back id 
};

// GET /api/files/:id
function extractBodyFromCppResponse(resp) {
  const s = String(resp || "");
  const idx = s.indexOf("\n\n");
  let body = idx >= 0 ? s.slice(idx + 2) : s;

  // if still start with status 200/404 make down the first line 
  body = body.replace(/^\s*\d{3}.*\n/, "");
  return body.replace(/\r/g, "").replace(/\s/g, "");
}

// GET /api/files/:id/download
exports.downloadFile = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) return res.status(404).json({ error: "File not found" });
  if (meta.type !== "file") return res.status(400).json({ error: "Cannot download a folder" });

  const client = new TcpClient(CPP_PORT, CPP_HOST);
  try {
    const response = await client.send(`GET ${id}`);
    
    if (String(response).startsWith("404")) {
      return res.status(404).json({ error: "File content missing on storage" });
    }

    const base64Content = extractBodyFromCppResponse(response);
    const fileBuffer = Buffer.from(base64Content, 'base64');

    res.setHeader('Content-Disposition', `attachment; filename="${meta.name}"`);
    res.setHeader('Content-Type', meta.mime || 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);

    return res.end(fileBuffer);

  } catch (e) {
    return res.status(500).json({ error: "Download failed" });
  }
};

exports.getFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) return res.status(404).json({ error: "File not found" });

  if (meta.type !== "file") {
    return res.status(200).json({ ...meta, content: null });
  }

  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const response = await client.send(`GET ${id}`);

    if (String(response).startsWith("404")) {
      return res.status(404).json({ error: "File content not found on storage" });
    }

    const content = extractBodyFromCppResponse(response);

    if (!/^[A-Za-z0-9+/=]*$/.test(content) || content.length < 50) {
      return res.status(500).json({
        error: "Corrupted base64 returned from storage",
        sample: content.slice(0, 60),
        len: content.length
      });
    }

    return res.status(200).json({
      ...meta,
      content,
      encoding: meta.encoding || "base64",
      mime: meta.mime || "application/octet-stream",
      size: meta.size ?? null,
    });
  } catch (e) {
    return res.status(500).json({ error: "Storage server error" });
  }
};

// DELETE /api/files/:id
exports.deleteFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      await client.send(`DELETE ${id}`);
    } catch (e) {
      return res.status(404).json({ error: 'Failed to delete from storage' });
    }
  }

  FileModel.delete(id);
  return res.status(204).end();
};

function buildSnippets(text, q, maxHits = 3, radius = 40) {
  const t = String(text || "");
  const qq = String(q || "").toLowerCase();
  const tt = t.toLowerCase();

  const hits = [];
  let idx = 0;

  while (hits.length < maxHits) {
    const pos = tt.indexOf(qq, idx);
    if (pos === -1) break;

    const start = Math.max(0, pos - radius);
    const end = Math.min(t.length, pos + q.length + radius);

    hits.push({
      snippet: (start > 0 ? "…" : "") + t.slice(start, end) + (end < t.length ? "…" : ""),
      index: pos,
    });

    idx = pos + q.length;
  }

  return hits;
}

function tryDecodeBase64ToUtf8(base64) {
  try {
    const buf = Buffer.from(String(base64 || ""), "base64");
    return buf.toString("utf8");
  } catch {
    return "";
  }
}

function getUserIdFromAuth(req) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return { error: "Access denied. No token provided." };

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { userId: decoded.id };
  } catch {
    return { error: "Invalid token." };
  }
}

// GET /api/search/:query
exports.searchFiles = async (req, res) => {
  const q = String(req.params.query || "").trim();
  if (!q) return res.status(400).json({ error: "Query is required" });

  // ✅ auth כמו getAllFiles
  const auth = getUserIdFromAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const userId = auth.userId;

  const parentIdFilter = req.query.parentId; 
  const includeTrashed = String(req.query.trashed) === "true"; 

  const allFiles = FileModel.getAll().filter(f => f.ownerId === userId);

  const qLower = q.toLowerCase();

  // --- 1) Name matches (case-insensitive) ---
  const nameMatches = allFiles.filter(f =>
    String(f.name || "").toLowerCase().includes(qLower)
  );

  // --- 2) Content matches via C++ SEARCH ---
  let contentMatchMetas = [];
  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const response = await client.send(`SEARCH ${q}`);

    // C++ returns: "200 Ok\n\n<ID1>\n<ID2>"
    if (!String(response).startsWith("404") && String(response).includes("\n\n")) {
      const parts = String(response).split("\n\n");
      const ids = (parts[1] || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      contentMatchMetas = ids
        .map(id => FileModel.findById(id))
        .filter(Boolean)
        .filter(f => f.ownerId === userId); // dont share other's files
    }
  } catch (error) {
    console.log("Content search warning:", error.message);
  }

  // --- 3) Merge uniques by id ---
  const byId = new Map();

  // Name matches get match info immediately
  for (const f of nameMatches) {
    byId.set(f.id, {
      ...f,
      match: { name: true, content: [] },
    });
  }

  const MAX_CONTENT_SNIPPETS_FILES = 10; 
  const contentCandidates = contentMatchMetas.slice(0, MAX_CONTENT_SNIPPETS_FILES);

  for (const meta of contentCandidates) {
    const existing = byId.get(meta.id);

    const mime = String(meta.mime || "");
    const isProbablyText =
      mime.startsWith("text/") || mime.includes("json") || mime.includes("xml") || mime.includes("csv");

    let contentHits = [];

    if (isProbablyText) {
      try {
        const resp = await client.send(`GET ${meta.id}`);
        if (!String(resp).startsWith("404")) {
          const base64 = extractBodyFromCppResponse(resp);
          const text = tryDecodeBase64ToUtf8(base64);
          contentHits = buildSnippets(text, q);
        }
      } catch {
      }
    }

    const merged = {
      ...(existing || meta),
      match: {
        name: existing?.match?.name ?? false,
        content: contentHits,
      },
    };

    byId.set(meta.id, merged);
  }

  for (const meta of contentMatchMetas.slice(MAX_CONTENT_SNIPPETS_FILES)) {
    const existing = byId.get(meta.id);
    byId.set(meta.id, {
      ...(existing || meta),
      match: {
        name: existing?.match?.name ?? false,
        content: existing?.match?.content ?? [{ snippet: "(match in content)", index: -1 }],
      },
    });
  }

  // --- 4) Apply filters (trashed/parent) ---
  let results = Array.from(byId.values());

  if (!includeTrashed) results = results.filter(f => !f.trashed);

  if (parentIdFilter !== undefined) {
    const pid = parentIdFilter || null;
    results = results.filter(f => (f.parentId ?? null) === pid);
  }

  return res.status(200).json(results);
};

// PATCH /api/files/:id/star
exports.setStarred = (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  meta.starred = Boolean(req.body?.starred);
  meta.updatedAt = new Date().toISOString();
  return res.status(200).json(meta);
};

// PATCH /api/files/:id/trash
exports.setTrashed = (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  meta.trashed = Boolean(req.body?.trashed);
  meta.updatedAt = new Date().toISOString();
  return res.status(200).json(meta);
};

// PATCH /api/files/:id/permissions
exports.replacePermissions = (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  const { permissions } = req.body || {};
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: "permissions must be an array" });
  }

  meta.permissions = permissions;
  meta.updatedAt = new Date().toISOString();

  return res.status(200).json(meta);
};

// DELETE /api/files/:id/shared (for unsharing)
exports.removeSharedFile = (req, res) => {
    try {
        const fileId = req.params.id;

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        const file = FileModel.findById(fileId);
        if (!file) {
            console.log(`[RemoveShared] File ${fileId} not found`);
            return res.status(404).json({ error: "File not found" });
        }

        if (Array.isArray(file.permissions)) {
            const initialCount = file.permissions.length;
            file.permissions = file.permissions.filter(p => {
                return p.holderId !== userId && p.userId !== userId;
            });
            console.log(`[RemoveShared] User ${userId} removed. Permissions: ${initialCount} -> ${file.permissions.length}`);
        } else {
            console.log(`[RemoveShared] No permissions array found for file ${fileId}`);
        }

        return res.status(200).json({ message: "Access removed" });
    } catch (err) {
        console.error("[RemoveShared] Critical Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};