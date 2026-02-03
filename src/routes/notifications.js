// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { notificationValidation } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones de una tienda (query: ?store_id=xxx&limit=50&offset=0)
router.get('/', notificationController.getNotifications);

// Obtener última notificación para ESP32 (query: ?store_id=xxx)
router.get('/latest', notificationController.getLatestNotification);

// Debug: Verificar tokens FCM de la tienda
router.get('/debug-tokens', notificationController.debugFCMTokens);

// Obtener estadísticas de notificaciones (query: ?store_id=xxx&days=30)
router.get('/stats', notificationController.getNotificationStats);

// Parsear notificación desde texto
router.post('/parse', notificationController.parseNotification);

// Crear notificación desde app (cualquier usuario autenticado puede crear)
router.post('/create', notificationController.createNotification);

// Crear y enviar notificación (owner y super_admin)
router.post(
  '/',
  authorizeRoles('owner', 'super_admin'),
  notificationValidation.create,
  notificationController.createNotification
);

module.exports = router;
