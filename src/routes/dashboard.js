// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener estadísticas del dashboard
router.get('/stats', dashboardController.getDashboardStats);

// Obtener transacciones recientes
router.get('/recent-transactions', dashboardController.getRecentTransactions);

// Obtener datos para el gráfico semanal
router.get('/weekly-chart', dashboardController.getWeeklyChart);

// Obtener estadísticas de reportes
router.get('/reports-stats', dashboardController.getReportsStats);

// Obtener métodos de pago
router.get('/payment-methods', dashboardController.getPaymentMethods);

// Obtener ventas diarias
router.get('/daily-sales', dashboardController.getDailySales);

module.exports = router;
