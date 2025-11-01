// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');

// Rutas públicas
router.post('/register', authValidation.register, authController.register);
router.post('/login', authValidation.login, authController.login);

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/fcm-token', authenticateToken, authController.registerFCMToken);

module.exports = router;
