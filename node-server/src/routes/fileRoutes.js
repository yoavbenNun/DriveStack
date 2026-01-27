const express = require('express');
const router = express.Router();

const fileController = require('../controllers/fileController');
const permissionsController = require('../controllers/permissions.controller');

router.post('/files', fileController.createFileOrDir);
router.post('/files/:id/permissions', permissionsController.addPermission);

router.get('/files/:id/permissions', permissionsController.getPermissions);
router.get('/files', fileController.getAllFiles);
router.get('/files/:id', fileController.getFileById);
router.get('/search/:query', fileController.searchFiles);

router.patch('/files/:id/permissions/:pId', permissionsController.updatePermission);
router.patch('/files/:id', fileController.updateFileById);

// ✅ restore route
router.patch('/files/:id/restore', fileController.restoreFileById);

// ✅ soft delete route
router.delete('/files/:id', fileController.deleteFileById);
router.delete('/files/:id/permissions/:pId', permissionsController.deletePermission);
// ✅ HARD delete route (delete forever)
router.delete('/files/:id/hard', fileController.hardDeleteFileById);

// ⭐ star
router.patch('/files/:id/star', fileController.starFileById);

// ⭐ unstar
router.patch('/files/:id/unstar', fileController.unstarFileById);

module.exports = router;