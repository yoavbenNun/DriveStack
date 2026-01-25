// web-server/src/controllers/fileController.js
const TcpClient = require('../services/TcpClient');
const FileModel = require('../models/file.model'); 
const { v4: uuidv4 } = require('uuid');

// C++ server
const CPP_PORT = process.env.CPP_PORT || 8080; 
const CPP_HOST = process.env.CPP_HOST || 'localhost';

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
  const allFiles = FileModel.getAll(); 
  return res.status(200).json(allFiles);
};

// PATCH /api/files/:id
exports.updateFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) {
    return res.status(404).json({ error: "File not found" });
  }

  const { name, parentId } = req.body || {};

  if (typeof name === "string" && name.trim() !== "") {
    meta.name = name.trim();
  }

  if (parentId !== undefined) {
    meta.parentId = parentId || null;
  }

  meta.updatedAt = new Date().toISOString();
  return res.status(204).end();
};


// POST /api/files
exports.createFileOrDir = async (req, res) => {
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

// GET /api/search/:query
exports.searchFiles = async (req, res) => {
  const query = req.params.query;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // (Metadata - Node.js Memory)
  const allFiles = FileModel.getAll(); 
  const nameMatches = allFiles.filter(file => file.name && file.name.includes(query));

  // (Storage - C++ Server)
  let contentMatches = [];
  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const response = await client.send(`SEARCH ${query}`);
    
    // C++ returns: "200 Ok\n\n<ID1>\n<ID2>"
    if (!response.startsWith('404') && response.includes('\n\n')) {
        const parts = response.split('\n\n');
        if (parts.length > 1) {
            const ids = parts[1].split('\n').filter(line => line.trim() !== '');
            contentMatches = ids.map(id => FileModel.findById(id)).filter(f => f);
        }
    }
  } catch (error) {
    console.log("Content search warning:", error.message);
  }

  const combinedResults = [...nameMatches];
  
  contentMatches.forEach(file => {
      if (!combinedResults.find(existing => existing.id === file.id)) {
          combinedResults.push(file);
      }
  });

  return res.status(200).json(combinedResults);
};