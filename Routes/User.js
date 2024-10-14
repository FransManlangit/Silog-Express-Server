const express = require('express');
const router = express.Router();
const upload = require("../Utils/Multer");
const { registerUser, updateProfile, verifyUserEmail, notificationAll, loginUser, logoutUser, getUserProfile } = require('../Controllers/UserController');
const { isAuthenticatedUser, authorizeRoles } = require("../Middlewares/Auth")



router.route('/register').post(registerUser);
router.put('/updateprofile', isAuthenticatedUser, upload.single("avatar"), updateProfile);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);
router.get('/userprofile', isAuthenticatedUser, getUserProfile);



router.route('/verify/email/:token/:id').get(verifyUserEmail);
router.get('/user-notification/unread', isAuthenticatedUser, notificationAll);




module.exports = router;