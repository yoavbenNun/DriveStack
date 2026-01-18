// src/models/file.model.js
const { v4: uuidv4 } = require('uuid');

// Use a Map for better performance and fast retrieval by ID (O(1))
const filesDb = new Map();

class FileModel {
    // The constructor accepts a data object for flexibility
    constructor(data) {
        this.id = data.id || uuidv4();
        this.name = data.name;
        this.type = data.type; // 'file' or 'dir'
        this.parentId = data.parentId || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        
        // Permissions array - integral part of the model
        this.permissions = data.permissions || []; 
    }

    // --- Static Methods (Database operations) ---

    static getAll() {
        // Convert Map values to an array
        return Array.from(filesDb.values());
    }

    static findById(id) {
        const fileData = filesDb.get(id);
        // Return the instance itself so methods like addPermission() will work
        return fileData; 
    }

    static create(data) {
        // Create a new instance of the class (Critical for instance methods)
        const newFile = new FileModel(data);
        // Save to the in-memory DB
        filesDb.set(newFile.id, newFile);
        return newFile;
    }

    static delete(id) {
        return filesDb.delete(id);
    }

    // --- Instance Methods (Operations on a specific file) ---

    addPermission(type, holderId) {
        const newPermission = {
            pId: uuidv4(),      // Unique ID for the permission
            type: type,      
            holderId: holderId 
        };
        this.permissions.push(newPermission);
        
        // Update the reference in the DB (redundant in JS due to reference, but good practice)
        filesDb.set(this.id, this); 
        
        return newPermission;
    }

    getPermissions() {
        return this.permissions;
    }

    findPermissionById(pId) {
        return this.permissions.find(p => p.pId === pId);
    }

    updatePermission(pId, newType) {
        const permission = this.findPermissionById(pId);
        if (permission) {
            permission.type = newType;
        }
        return permission;
    }

    removePermission(pId) {
        const initialLength = this.permissions.length;
        this.permissions = this.permissions.filter(p => p.pId !== pId);
        
        return this.permissions.length < initialLength;
    }
}

module.exports = FileModel;