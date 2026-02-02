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

// ⚠️ DEPRECADO: Usar /api/admin/create-super-admin en su lugar
// Este endpoint solo funciona en desarrollo y requiere secret key
// En producción, crear super admins desde el panel de admin protegido
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_PUBLIC_SUPER_ADMIN === 'true') {
  router.post('/create-super-admin', registerLimiter, authController.createSuperAdmin);
  console.log('⚠️  ADVERTENCIA: Endpoint público /create-super-admin está HABILITADO');
  console.log('   Solo usar en desarrollo. Usa /api/admin/create-super-admin en producción');
}

// Google Sign-In
router.post('/google', loginLimiter, authController.googleSignIn);

// Recuperación de contraseña
router.post('/forgot-password', loginLimiter, authController.forgotPassword);
router.post('/verify-reset-code', loginLimiter, authController.verifyResetCode);
router.post('/reset-password', loginLimiter, authController.resetPassword);

// Verificación de email para registro
router.post('/send-email-verification', registerLimiter, authController.sendEmailVerification);
router.post('/verify-email-code', loginLimiter, authController.verifyEmailCode);

// Rutas protegidas (requieren autenticación)
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/fcm-token', authenticateToken, authController.registerFCMToken);
router.post('/verify-phone', authenticateToken, authController.verifyPhone);

module.exports = router;
