// web-server/src/controllers/fileController.js
const TcpClient = require('../services/TcpClient');

// must match C++ server
const CPP_PORT = 5555;
const CPP_HOST = '127.0.0.1';

// In-memory metadata store: id -> { id, name, type, parentId, createdAt, updatedAt }
const files = new Map();

function normalizeType(type) {
  return type === 'dir' ? 'dir' : 'file';
}

//already existing endpoint (search)
exports.searchFiles = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const client = new TcpClient(CPP_PORT, CPP_HOST);

  try {
    const command = `SEARCH ${query}`;
    const response = await client.send(command);

    return res.status(200).json({
      success: true,
      query,
      data: response,
    });
  } catch (error) {
    return res.status(404).json({
      error: 'Failed to communicate with C++ Server',
      details: error.message,
    });
  }
};

//POST /api/files (create file/dir)
exports.createFileOrDir = async (req, res) => {
  const { name, type, parentId, content } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = require('crypto').randomUUID();
  const t = normalizeType(type);
  const now = new Date().toISOString();

  // create physical file in C++ only if it's a file
  if (t === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      // 🔁 adjust if your ADD syntax differs
      const encoded = Buffer.from(content ?? '', 'utf8').toString('base64');
      const cmd = `POST ${id} ${encoded}`;
      
      await client.send(cmd);

    } catch (e) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  files.set(id, {
    id,
    name: name.trim(),
    type: t,
    parentId: parentId ?? null,
    createdAt: now,
    updatedAt: now,
  });

  res.setHeader('Location', `/api/files/${id}`);
  return res.status(201).end();
};

// GET/api/files/:id
// GET /api/files/:id
exports.getFileById = async (req, res) => {
  const id = req.params.id;
  const meta = files.get(id);
  if (!meta) return res.status(404).json({ error: 'File not found' });

  if (meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);

    try {
      const response = await client.send(`GET ${id}`);

      // C++ returns: "404 Not Found\n" OR "200 Ok\n\n<decompressed>"
      if (response.startsWith('404')) {
        return res.status(404).json({ error: 'File not found' });
      }
      if (!response.startsWith('200')) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      // take body after the blank line
      const parts = response.split('\n\n');
      const body = parts.length > 1 ? parts.slice(1).join('\n\n') : '';

      // body should be the Base64 string we stored via ADD
      let decodedContent = body;
      try {
        decodedContent = Buffer.from(body, 'base64').toString('utf8');
      } catch {}

      return res.status(200).json({
        id: meta.id,
        name: meta.name,
        type: meta.type,
        parentId: meta.parentId,
        content: decodedContent,
      });
    } catch (e) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // dir
  return res.status(200).json({
    id: meta.id,
    name: meta.name,
    type: meta.type,
    parentId: meta.parentId,
  });
};


// PATCH/api/files/:id  (rename + optional content update)
exports.updateFileById = async (req, res) => {
  const id = req.params.id;
  const meta = files.get(id);
  if (!meta) return res.status(404).json({ error: 'File not found' });

  const { name, content } = req.body || {};

  // rename
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    meta.name = name.trim();
  }

  if (content !== undefined) {
    return res.status(400).json({ error: 'Bad request' });
  }

  meta.updatedAt = new Date().toISOString();
  files.set(id, meta);
  return res.status(204).end();
};

// DELETE/api/files/:id
exports.deleteFileById = async (req, res) => {
  const id = req.params.id;
  const meta = files.get(id);
  if (!meta) return res.status(404).json({ error: 'File not found' });

  if (meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      await client.send(`DELETE ${id}`);
    } catch (e) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  files.delete(id);
  return res.status(204).end();
};
