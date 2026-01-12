const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/files', fileController.searchFiles);

router.post('/', fileController.createFileOrDir);
router.get('/:id', fileController.getFileById);
router.patch('/:id', fileController.updateFileById);
router.delete('/:id', fileController.deleteFileById);

module.exports = router;