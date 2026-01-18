// web-server/src/controllers/fileController.js
const TcpClient = require('../services/TcpClient');
const FileModel = require('../models/file.model'); 
const { v4: uuidv4 } = require('uuid');

// C++ server
const CPP_PORT = 5555;
const CPP_HOST = '127.0.0.1';

function normalizeType(type) {
  return type === 'dir' ? 'dir' : 'file';
}

// GET /api/files
exports.getAllFiles = (req, res) => {
  const allFiles = FileModel.getAll(); 
  return res.status(200).json(allFiles);
};

// GET /api/files/:id
exports.getFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);
  
  if (!meta) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (meta.type === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const response = await client.send(`GET ${id}`);

      if (response.startsWith('404')) {
        return res.status(404).json({ error: 'File content not found on storage' });
      }
      
      const parts = response.split('\n\n');
      const body = parts.length > 1 ? parts.slice(1).join('\n\n') : '';

      let content = body;
      try {
        content = Buffer.from(body, 'base64').toString('utf8');
      } catch (e) {}

      // return all data
      return res.status(200).json({
        ...meta, 
        content: content
      });

    } catch (e) {
      return res.status(404).json({ error: 'Storage server error' });
    }
  }

  return res.status(200).json(meta);
};

// POST /api/files
exports.createFileOrDir = async (req, res) => {
  const { name, type, parentId, content } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = uuidv4();
  const t = normalizeType(type);
  const now = new Date().toISOString();

  if (t === 'file') {
    const client = new TcpClient(CPP_PORT, CPP_HOST);
    try {
      const encodedContent = Buffer.from(content || '', 'utf8').toString('base64');
      await client.send(`POST ${id} ${encodedContent}`);
    } catch (e) {
      return res.status(404).json({ error: 'Failed to create file on storage server' });
    }
  }

  // using the model we wrote
  FileModel.create({
    id,
    name: name.trim(),
    type: t,
    parentId: parentId || null,
    createdAt: now,
    updatedAt: now,
    permissions: []
  });

  res.setHeader('Location', `/api/files/${id}`);
  return res.status(201).end(); 
};

// PATCH /api/files/:id
exports.updateFileById = async (req, res) => {
  const id = req.params.id;
  const meta = FileModel.findById(id);

  if (!meta) {
    return res.status(404).json({ error: 'File not found' });
  }

  const { name } = req.body || {};
  if (name) {
    meta.name = name;
    meta.updatedAt = new Date().toISOString();
  }

  return res.status(204).end();
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

  const client = new TcpClient(CPP_PORT, CPP_HOST);
  try {
    const response = await client.send(`SEARCH ${query}`);
    return res.status(200).json({
      query: query,
      results: response 
    });
  } catch (error) {
    return res.status(404).json({ error: 'Search failed' });
  }
};