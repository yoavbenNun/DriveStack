const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/files', fileController.searchFiles);

module.exports = router;