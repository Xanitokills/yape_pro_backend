// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Rutas públicas con rate limiting
router.post('/register', registerLimiter, authValidation.register, authController.register);
router.post('/login', loginLimiter, authValidation.login, authController.login);
router.post('/register-worker', authController.registerWorker);

// Google Sign-In
router.post('/google', loginLimiter, authController.googleSignIn);

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/fcm-token', authenticateToken, authController.registerFCMToken);

module.exports = router;
