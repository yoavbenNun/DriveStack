const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/users', userController.register);
router.post('/tokens', userController.login);
router.get('/users/:id', userController.getUser);

module.exports = router;