const TcpClient = require('../services/TcpClient');
const FileModel = require('../models/file.model'); 

// C++ server
const CPP_PORT = process.env.CPP_PORT || 8080; 
const CPP_HOST = process.env.CPP_HOST || 'localhost';

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'my_secret_key_123'; 

function normalizeType(type) {
  const t = String(type ?? "").toLowerCase();
  if (["folder", "dir", "directory"].includes(t)) return "folder";
  return "file";
}

function cleanBase64(s) {
  return String(s || "").replace(/\r/g, "").replace(/\s/g, "");
}

// GET /api/files
exports.getAllFiles = async (req, res) => {
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
    
    let query = {};

    if (String(shared) === "true") {
      query = { 
          "permissions.holderId": userId,
          ownerId: { $ne: userId } 
      };
    } else {
      query = { ownerId: userId };
    }

    if (starred !== undefined) {
      query.starred = String(starred) === "true";
    }

    if (trashed !== undefined) {
      query.trashed = String(trashed) === "true";
    }

    let allFiles = await FileModel.find(query);

    const formattedFiles = allFiles.map(file => {
        const obj = file.toJSON();
        if (String(shared) === "true") obj.shared = true;
        return obj;
    });

    return res.status(200).json(formattedFiles);
  } catch (e) {
    console.error("getAllFiles failed:", e);
    return res.status(500).json({ error: e.message || "getAllFiles failed" });
  }
};

// PATCH /api/files/:id
exports.updateFileById = async (req, res) => {
  const id = req.params.id;
  const meta = await FileModel.findById(id); 

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

  if (typeof content === 'string' && content.trim() !== "" && meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = cleanBase64(content);

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
      return res.status(500).json({ error: "Failed to save file content" });
    }
  }

  await meta.save(); 
  return res.status(200).json(meta);
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

  const t = normalizeType(type);

  const newFile = new FileModel({
    name: name.trim(),
    type: t,
    parentId: parentId || null,
    ownerId: userId,
    permissions: [],
    mime: mime || null,
    encoding: encoding || null,
    size: typeof size === "number" ? size : null,
  });

  const id = newFile._id.toString(); 

  if (t === "file") {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = cleanBase64(content).replace(/[\r\n]+/g, "");
      await client.send(`POST ${id} ${encodedContent}`);
    } catch (e) {
      return res.status(404).json({ error: "Failed to create file on storage server" });
    }
  }

  await newFile.save(); 

  res.setHeader("Location", `/api/files/${id}`);
  return res.status(201).json({ id });
};

// GET /api/files/:id
function extractBodyFromCppResponse(resp) {
  const s = String(resp || "");
  const idx = s.indexOf("\n\n");
  let body = idx >= 0 ? s.slice(idx + 2) : s;
  body = body.replace(/^\s*\d{3}.*\n/, "");
  return body.replace(/\r/g, "").replace(/\s/g, "");
}

// GET /api/files/:id/download
exports.downloadFile = async (req, res) => {
  const id = req.params.id;
  const meta = await FileModel.findById(id);

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
  const meta = await FileModel.findById(id);

  if (!meta) return res.status(404).json({ error: "File not found" });

  if (meta.type !== "file") {
    return res.status(200).json({ ...meta.toJSON(), content: null });
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
      ...meta.toJSON(),
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
  const meta = await FileModel.findById(id);

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

  await FileModel.findByIdAndDelete(id); 
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

  const auth = getUserIdFromAuth(req);
  if (auth.error) return res.status(401).json({ error: auth.error });
  const userId = auth.userId;

  const parentIdFilter = req.query.parentId; 
  const includeTrashed = String(req.query.trashed) === "true"; 

  const nameMatches = await FileModel.find({
      ownerId: userId,
      name: { $regex: q, $options: 'i' }
  });

  // --- 2) Content matches via C++ SEARCH ---
  let contentMatchMetas = [];
  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const response = await client.send(`SEARCH ${q}`);

    if (!String(response).startsWith("404") && String(response).includes("\n\n")) {
      const parts = String(response).split("\n\n");
      const ids = (parts[1] || "")
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      const foundMetas = await FileModel.find({
          _id: { $in: ids },
          ownerId: userId,
          type: 'file'
      });

      contentMatchMetas = foundMetas.filter(f => {
          const mime = String(f.mime || "").toLowerCase();
          const name = String(f.name || "").toLowerCase();
          
          const isTextMime = mime.startsWith("text/") || mime.includes("json") || mime.includes("xml") || mime.includes("csv");
          const isTextExt = name.endsWith(".txt") || name.endsWith(".js") || name.endsWith(".html") || name.endsWith(".css") || name.endsWith(".cpp") || name.endsWith(".h") || name.endsWith(".md");
          
          return isTextMime || isTextExt;
      });
    }
  } catch (error) {
    console.log("Content search warning:", error.message);
  }

  // --- 3) Merge uniques by id ---
  const byId = new Map();

  for (const f of nameMatches) {
    byId.set(f.id, {
      ...f.toJSON(),
      match: { name: true, content: [] },
    });
  }

  const MAX_CONTENT_SNIPPETS_FILES = 10; 
  const contentCandidates = contentMatchMetas.slice(0, MAX_CONTENT_SNIPPETS_FILES);

  for (const meta of contentCandidates) {
    const existing = byId.get(meta.id);
    let contentHits = [];

    try {
      const resp = await client.send(`GET ${meta.id}`);
      if (!String(resp).startsWith("404")) {
        const base64 = extractBodyFromCppResponse(resp);
        const text = tryDecodeBase64ToUtf8(base64);
        contentHits = buildSnippets(text, q);
      }
    } catch { }

    const merged = {
      ...(existing || meta.toJSON()),
      match: {
        name: existing?.match?.name ?? false,
        content: contentHits,
      },
    };
    byId.set(meta.id, merged);
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
exports.setStarred = async (req, res) => {
  const id = req.params.id;
  const meta = await FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  meta.starred = Boolean(req.body?.starred);
  await meta.save();
  return res.status(200).json(meta);
};

// PATCH /api/files/:id/trash
exports.setTrashed = async (req, res) => {
  const id = req.params.id;
  const meta = await FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  meta.trashed = Boolean(req.body?.trashed);
  if (meta.trashed) meta.deletedAt = new Date();
  else meta.deletedAt = null;
  
  await meta.save();
  return res.status(200).json(meta);
};

// PATCH /api/files/:id/permissions
exports.replacePermissions = async (req, res) => {
  const id = req.params.id;
  const meta = await FileModel.findById(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  const { permissions } = req.body || {};
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: "permissions must be an array" });
  }

  meta.permissions = permissions;
  await meta.save();

  return res.status(200).json(meta);
};

// DELETE /api/files/:id/shared
exports.removeSharedFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        const file = await FileModel.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        file.permissions = file.permissions.filter(p => p.holderId !== userId);
        await file.save();

        return res.status(200).json({ message: "Access removed" });
    } catch (err) {
        console.error("[RemoveShared] Critical Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const fs = require('fs');

// POST /api/files/upload
exports.uploadFile = async (req, res) => {
  try {
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

    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const { parentId } = req.body;
    const file = req.file;

    const newFile = new FileModel({
      name: file.originalname, 
      type: 'file',
      parentId: parentId || null,
      ownerId: userId,
      permissions: [],
      mime: file.mimetype,
      size: file.size,
    });

    const fileId = newFile._id.toString();

    const fileBuffer = fs.readFileSync(file.path);
    const base64Content = fileBuffer.toString('base64');
    
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      await client.send(`POST ${fileId} ${base64Content}`);
    } catch (cppError) {
      console.error("Failed to save to C++:", cppError);
      return res.status(500).json({ error: "Failed to create file on storage server" });
    }

    await newFile.save();
    fs.unlinkSync(file.path);

    res.status(201).json({ 
      message: "File uploaded successfully",
      file: newFile 
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error during upload" });
  }
};