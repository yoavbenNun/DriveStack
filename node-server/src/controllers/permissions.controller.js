const FileModel = require('../models/file.model');
const UserModel = require('../models/user.model');

// GET /api/files/:id/permissions
exports.getPermissions = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await FileModel.findById(fileId);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json(file.permissions);
    } catch (error) {
        console.error('Get Permissions Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/files/:id/permissions
exports.addPermission = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { email, type = 'reader' } = req.body; 

        const file = await FileModel.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Missing email address' });
        }

        const targetUser = await UserModel.findOne({ email });

        if (!targetUser) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }

        const holderId = targetUser.id;
        
        const newPermission = { type, holderId };
        
        file.permissions.push(newPermission);
        await file.save();
        
        const addedPermission = file.permissions[file.permissions.length - 1];
        
        res.status(201).json(addedPermission); // 201 Created
    } catch (error) {
        console.error('Add Permission Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/files/:id/permissions/:pId
exports.updatePermission = async (req, res) => {
    try {
        const { id, pId } = req.params;
        const { type } = req.body;

        const file = await FileModel.findById(id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const permission = file.permissions.find(p => p.pId === pId);
        if (!permission) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        permission.type = type;
        await file.save();

        res.json(permission);
    } catch (error) {
        console.error('Update Permission Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/files/:id/permissions/:pId
exports.deletePermission = async (req, res) => {
    try {
        const { id, pId } = req.params;

        const file = await FileModel.findById(id);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const initialLength = file.permissions.length;
        
        file.permissions = file.permissions.filter(p => p.pId !== pId);
        
        if (file.permissions.length === initialLength) {
            return res.status(404).json({ error: 'Permission not found' });
        }

        await file.save();

        res.status(204).send(); // 204 No Content 
    } catch (error) {
        console.error('Delete Permission Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};