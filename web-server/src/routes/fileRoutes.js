const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');


router.get('/files', fileController.searchFiles); 
router.post('/files', fileController.createFileOrDir); 


router.get('/files/:id', fileController.getFileById);
router.patch('/files/:id', fileController.updateFileById);
router.delete('/files/:id', fileController.deleteFileById);

module.exports = router;