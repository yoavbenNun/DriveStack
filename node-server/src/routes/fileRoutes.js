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

router.get('/files/:id/download', fileController.downloadFile);

router.patch('/files/:id/permissions/:pId', permissionsController.updatePermission);
router.patch('/files/:id', fileController.updateFileById);

router.delete('/files/:id', fileController.deleteFileById);
router.delete('/files/:id/permissions/:pId', permissionsController.deletePermission);
router.delete('/files/:id/shared', fileController.removeSharedFile);

router.patch("/files/:id/star", fileController.setStarred);
router.patch("/files/:id/trash", fileController.setTrashed);
router.patch("/files/:id/permissions", fileController.replacePermissions);

router.get('/search/:query', fileController.searchFiles);
module.exports = router;