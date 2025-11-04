// src/routes/test.js
const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateToken } = require('../middleware/auth');

// 🧪 RUTAS DE TESTING - Solo para desarrollo

// Obtener tiendas disponibles para testing (requiere auth)
router.get('/stores', authenticateToken, testController.getTestStores);

// Simular una notificación de Yape/Plin (requiere auth)
router.post('/simulate-notification', authenticateToken, testController.simulateNotification);

// Simular múltiples notificaciones (batch) (requiere auth)
router.post('/simulate-batch', authenticateToken, testController.simulateBatch);

module.exports = router;
