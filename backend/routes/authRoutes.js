const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, register, merchantRegister, login, getMe, loginPassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/merchant-register', merchantRegister);
router.post('/login', login);
router.post('/login-password', loginPassword); // keeping existing password login
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile); // profile update route

module.exports = router;
