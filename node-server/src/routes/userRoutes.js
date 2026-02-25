const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// user register
router.post('/users', userController.register);
// user Login
router.post('/login', userController.login);

router.post('/tokens', userController.login);
router.get('/users/:id', userController.getUser);

// delete and change profile picture
router.patch('/users/:id/image', userController.updateProfileImage);
router.delete('/users/:id/image', userController.deleteProfileImage);

module.exports = router;