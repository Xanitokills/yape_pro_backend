// server.js
require('dotenv').config();
const app = require('./src/app');
const { processRenewalReminders } = require('./src/services/renewalNotificationService');
const { preloadPatterns } = require('./src/services/parsers/dynamicParser');

const PORT = process.env.PORT || 3002;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Railway assigned port: ${process.env.PORT || 'not set, using fallback'}`);
  
  // Pre-cargar patrones de notificación (optimización de velocidad) - no bloqueante
  preloadPatterns().catch(err => {
    console.error('⚠️  Error preloading patterns:', err.message);
  });
  
  // Keep-alive: Ping cada 5 minutos para evitar que Railway duerma el servicio
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    const KEEP_ALIVE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`
      : `https://yapeprobackend-production.up.railway.app/health`;
    
    setInterval(async () => {
      try {
        const response = await fetch(KEEP_ALIVE_URL);
        console.log(`💓 Keep-alive ping: ${response.status}`);
      } catch (error) {
        console.log(`💔 Keep-alive failed: ${error.message}`);
      }
    }, 5 * 60 * 1000); // Cada 5 minutos
    
    console.log(`💓 Keep-alive enabled: pinging every 5 minutes`);

    // Cron job para recordatorios de renovación - cada 6 horas
    // Ejecutar inmediatamente al iniciar y luego cada 6 horas
    setTimeout(async () => {
      console.log('📧 Ejecutando verificación inicial de renovaciones...');
      await processRenewalReminders();
    }, 30000); // 30 segundos después de iniciar

    setInterval(async () => {
      console.log('📧 Ejecutando verificación programada de renovaciones...');
      await processRenewalReminders();
    }, 6 * 60 * 60 * 1000); // Cada 6 horas
    
    console.log(`📧 Renewal reminders: checking every 6 hours`);
  }
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
