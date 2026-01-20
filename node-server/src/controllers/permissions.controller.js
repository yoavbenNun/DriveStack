const FileModel = require('../models/file.model');

// GET /api/files/:id/permissions
exports.getPermissions = (req, res) => {
    const fileId = req.params.id;
    const file = FileModel.findById(fileId);

    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.json(file.getPermissions());
};

// POST /api/files/:id/permissions
exports.addPermission = (req, res) => {
    const fileId = req.params.id;
    const { type, holderId } = req.body; 

    const file = FileModel.findById(fileId);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (!type || !holderId) {
        return res.status(400).json({ error: 'Missing type or holderId' });
    }

    const newPermission = file.addPermission(type, holderId);
    res.status(201).json(newPermission); // 201 Created
};

// PATCH /api/files/:id/permissions/:pId
exports.updatePermission = (req, res) => {
    const { id, pId } = req.params;
    const { type } = req.body;

    const file = FileModel.findById(id);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    const updatedPermission = file.updatePermission(pId, type);
    if (!updatedPermission) {
        return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(updatedPermission);
};

// DELETE /api/files/:id/permissions/:pId
exports.deletePermission = (req, res) => {
    const { id, pId } = req.params;

    const file = FileModel.findById(id);
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    const isDeleted = file.removePermission(pId);
    if (!isDeleted) {
        return res.status(404).json({ error: 'Permission not found' });
    }

    res.status(204).send(); // 204 No Content 
};