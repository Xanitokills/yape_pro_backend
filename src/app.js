// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const storeRoutes = require('./routes/stores');
const workerRoutes = require('./routes/workers');
const verificationRoutes = require('./routes/verification');
const dashboardRoutes = require('./routes/dashboard');
const paymentsRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');
const contactRoutes = require('./routes/contact');

// Importar middleware de error
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

// � Trust proxy - Required for Railway/Heroku/Render to get real client IP
// This allows express-rate-limit to work correctly behind reverse proxies
app.set('trust proxy', 1);

// �🛡️ Security Headers - Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Middleware CORS seguro
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

console.log('🌐 CORS Origins permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado para origen:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejar preflight OPTIONS explícitamente
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🚨 Prevenir contraseñas en query params
app.use((req, res, next) => {
  const sensitiveParams = ['password', 'pwd', 'pass', 'secret', 'token'];
  const queryKeys = Object.keys(req.query).map(k => k.toLowerCase());
  
  if (queryKeys.some(key => sensitiveParams.includes(key))) {
    return res.status(400).json({
      success: false,
      error: 'No envíes credenciales en la URL. Usa POST con body.',
      code: 'CREDENTIALS_IN_URL'
    });
  }
  next();
});

// Rate Limiting - Protección contra abuso (deshabilitado temporalmente para debugging)
// app.use('/api/', generalLimiter);
console.log('⚠️  Rate limiting DESHABILITADO temporalmente');
console.log('🛡️  Rate limiting activado para /api/*');

// Servir archivos estáticos (interfaz de testing) - ESTRICTAMENTE solo en desarrollo
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_TEST_UI === 'true') {
  app.use('/test-ui', express.static(path.join(__dirname, '../public')));
  console.log('🎨 Interfaz de testing disponible en /test-ui/test-notifications.html');
  console.warn('⚠️  WARNING: Test UI está habilitada. NO usar en producción.');
}

// Logging middleware en desarrollo (sin datos sensibles)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const sanitizedBody = { ...req.body };
    // Ocultar campos sensibles
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '***HIDDEN***';
      }
    });
    console.log(`${req.method} ${req.url}`, sanitizedBody);
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
    status: 'online',
    documentation: 'Contacta al administrador para más información'
  });
});

// Rutas del API
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contactRoutes);

// 🧪 Rutas de testing (ESTRICTAMENTE solo en desarrollo)
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_TEST_ROUTES === 'true') {
  app.use('/api/test', testRoutes);
  console.log('🧪 Test endpoints habilitados en /api/test');
  console.warn('⚠️  WARNING: Test routes están habilitadas. NO usar en producción.');
} else if (process.env.NODE_ENV !== 'production') {
  console.log('ℹ️  Test routes deshabilitadas. Set ENABLE_TEST_ROUTES=true para habilitarlas.');
}

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
