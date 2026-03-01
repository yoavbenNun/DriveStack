const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // חשוב: ודא שהתיקייה הזו קיימת בשרת!
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)

    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext)
  }
});
const upload = multer({ storage: storage });


router.post('/users', upload.single('profilePicture'), userController.register);
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