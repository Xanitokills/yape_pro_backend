// src/routes/verification.js
const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// Estas rutas NO requieren autenticación (son para el registro)

// Verificar disponibilidad de teléfono
router.get('/check-phone', verificationController.checkPhoneAvailability);

// Enviar código de verificación
router.post('/send-code', verificationController.sendVerificationCode);

// Verificar código
router.post('/verify-code', verificationController.verifyCode);

module.exports = router;
