const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, logoutUser, verifyEmail, forgotPassword, resetPassword, resetUsername } = require('../controllers/authControllers')

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getProfile);
router.post('/logout', logoutUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-username', resetUsername);


module.exports = router;