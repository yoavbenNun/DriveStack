// node-server/src/models/file.model.js
const { v4: uuidv4 } = require("uuid");

const filesDb = new Map();

class FileModel {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.type = data.type; // 'file' or 'dir'
    this.parentId = data.parentId || null;

    // ✅ Owner (per user drive)
    this.ownerId = data.ownerId || null;

    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    // ✅ soft delete
    this.deletedAt = data.deletedAt ?? null;

    // ✅ starred
    this.starredAt = data.starredAt ?? null;

    // Permissions array
    this.permissions = data.permissions || [];
  }

  // ---------- Static Methods ----------

  static getAll() {
    return Array.from(filesDb.values());
  }

  static findById(id) {
    return filesDb.get(id) || null;
  }

  static create(data) {
    const newFile = new FileModel(data);
    filesDb.set(newFile.id, newFile);
    return newFile;
  }

  // ✅ helper to persist changes safely
  static save(fileInstance) {
    filesDb.set(fileInstance.id, fileInstance);
    return fileInstance;
  }

  // ✅ HARD DELETE: remove completely from DB
  static remove(id) {
    return filesDb.delete(id); // true/false
  }

  static getAllActive() {
    return Array.from(filesDb.values()).filter((f) => !f.deletedAt);
  }

  // ---------- Instance Methods ----------

  addPermission(type, holderId) {
    const newPermission = {
      pId: uuidv4(),
      type,
      holderId,
    };

    this.permissions.push(newPermission);
    FileModel.save(this);
    return newPermission;
  }

  getPermissions() {
    return this.permissions;
  }

  findPermissionById(pId) {
    return this.permissions.find((p) => p.pId === pId);
  }

  updatePermission(pId, newType) {
    const permission = this.findPermissionById(pId);
    if (permission) {
      permission.type = newType;
      FileModel.save(this);
    }
    return permission;
  }

  removePermission(pId) {
    const before = this.permissions.length;
    this.permissions = this.permissions.filter((p) => p.pId !== pId);

    const changed = this.permissions.length < before;
    if (changed) FileModel.save(this);

    return changed;
  }
}

module.exports = FileModel;