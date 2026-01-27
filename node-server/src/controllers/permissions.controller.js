const { v4: uuidv4 } = require("uuid");
const FileModel = require("../models/file.model");

// ✅ Get userId from auth middleware OR from x-user-id header (fallback)
function getUserId(req) {
  if (req.user?.id) return req.user.id;
  const headerId = req.headers["x-user-id"];
  if (headerId) return headerId;
  return null;
}

// ✅ Permissions can be managed only by the file owner
function requireOwner(req, file) {
  const userId = getUserId(req);
  if (!userId) return { ok: false, status: 401, error: "Missing user id" };
  if (!file) return { ok: false, status: 404, error: "File not found" };
  if (file.ownerId !== userId)
    return { ok: false, status: 403, error: "Only owner can manage sharing" };
  return { ok: true, userId };
}

// ✅ helper: ensures array exists
function ensurePerms(file) {
  if (!file.permissions || !Array.isArray(file.permissions)) {
    file.permissions = [];
  }
  return file.permissions;
}

// GET /api/files/:id/permissions
exports.getPermissions = (req, res) => {
  const fileId = req.params.id;
  const file = FileModel.findById(fileId);

  const auth = requireOwner(req, file);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  return res.json(ensurePerms(file));
};

// POST /api/files/:id/permissions
exports.addPermission = (req, res) => {
  const fileId = req.params.id;
  const { type, holderId } = req.body || {};

  const file = FileModel.findById(fileId);
  const auth = requireOwner(req, file);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (!type || !holderId) {
    return res.status(400).json({ error: "Missing type or holderId" });
  }

  const perms = ensurePerms(file);

  // ✅ no duplicates for same user
  if (perms.some((p) => p.holderId === holderId)) {
    return res.status(409).json({ error: "Permission already exists" });
  }

  const newPerm = {
    pId: uuidv4(),
    type,
    holderId,
  };

  perms.push(newPerm);

  // ✅ הכי חשוב: לשמור את זה במודל
  file.permissions = perms;
  file.updatedAt = new Date().toISOString();
  FileModel.save(file);

  return res.status(201).json(newPerm);
};

// PATCH /api/files/:id/permissions/:pId
exports.updatePermission = (req, res) => {
  const { id, pId } = req.params;
  const { type } = req.body || {};

  const file = FileModel.findById(id);
  const auth = requireOwner(req, file);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const perms = ensurePerms(file);
  const perm = perms.find((p) => p.pId === pId);
  if (!perm) return res.status(404).json({ error: "Permission not found" });

  perm.type = type || perm.type;

  file.permissions = perms;
  file.updatedAt = new Date().toISOString();
  FileModel.save(file);

  return res.json(perm);
};

// DELETE /api/files/:id/permissions/:pId
exports.deletePermission = (req, res) => {
  const { id, pId } = req.params;

  const file = FileModel.findById(id);
  const auth = requireOwner(req, file);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const perms = ensurePerms(file);
  const next = perms.filter((p) => p.pId !== pId);

  if (next.length === perms.length) {
    return res.status(404).json({ error: "Permission not found" });
  }

  file.permissions = next;
  file.updatedAt = new Date().toISOString();
  FileModel.save(file);

  return res.status(204).end();
};