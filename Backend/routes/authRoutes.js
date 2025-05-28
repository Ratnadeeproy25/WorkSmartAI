const express = require('express');
const router = express.Router();
const {
  login,
  loginWithQr,
  verifyEmail,
  getCurrentUser,
  protect
} = require('../controllers/authController');

// Auth routes
router.post('/login', login);
router.post('/login-qr', loginWithQr);
router.post('/verify-email', verifyEmail);

// Protected route for getting current user
router.get('/me', protect, getCurrentUser);

module.exports = router; 