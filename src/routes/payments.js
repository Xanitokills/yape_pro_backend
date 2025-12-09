// src/routes/payments.js
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const { authenticateToken } = require('../middleware/auth');

// Crear orden de pago (genera QR para Yape/Plin o datos bancarios)
router.post('/create-order', paymentsController.createPaymentOrder);

// Verificar estado del pago
router.get('/status/:reference', paymentsController.checkPaymentStatus);

// Webhook para confirmación de pago (desde proveedor)
router.post('/webhook', paymentsController.handleWebhook);

// [ADMIN] Listar todos los pagos
router.get('/list', authenticateToken, paymentsController.listPayments);

module.exports = router;
