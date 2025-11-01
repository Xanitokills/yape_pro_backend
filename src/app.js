// src/app.js
const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const storeRoutes = require('./routes/stores');
const workerRoutes = require('./routes/workers');

// Importar middleware de error
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Raíz del API
app.get('/', (req, res) => {
  res.json({
    name: 'Yape Pro API',
    version: '1.0.0',
    description: 'Backend API para gestión de notificaciones de pagos',
    endpoints: {
      auth: '/api/auth',
      notifications: '/api/notifications',
      stores: '/api/stores',
      workers: '/api/workers',
      health: '/health'
    },
    documentation: 'Ver BACKEND_SETUP_GUIDE.md para más información'
  });
});

// Rutas del API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/workers', workerRoutes);

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.url} no existe`,
    availableEndpoints: [
      '/api/auth',
      '/api/notifications',
      '/api/stores',
      '/api/workers',
      '/health'
    ]
  });
});

// Error handler global
app.use(errorHandler);

module.exports = app;
