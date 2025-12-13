/**
 * Servicio de Notificaciones de Renovación
 * Envía push notifications a usuarios con suscripciones por expirar
 */

const { supabase } = require('../config/database');
const subscriptionService = require('./subscriptionService');

// Firebase Admin SDK (si está configurado)
let admin = null;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    // Inicializar solo si no está inicializado
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;
    
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin inicializado para notificaciones de renovación');
    }
  }
} catch (error) {
  console.log('⚠️ Firebase Admin no disponible, notificaciones push deshabilitadas');
}

/**
 * Configuración de mensajes por días restantes
 */
const RENEWAL_MESSAGES = {
  7: {
    title: '⏰ Tu plan vence en 7 días',
    body: 'Renueva ahora para seguir disfrutando de todas las funciones Premium.',
    data: { action: 'renew', daysRemaining: '7' }
  },
  3: {
    title: '⚠️ Tu plan vence en 3 días',
    body: '¡No pierdas acceso a tus funciones Premium! Renueva hoy.',
    data: { action: 'renew', daysRemaining: '3' }
  },
  1: {
    title: '🚨 ¡Tu plan vence mañana!',
    body: 'Renueva ahora para evitar perder acceso a funciones Premium.',
    data: { action: 'renew', daysRemaining: '1' }
  },
  0: {
    title: '❌ Tu plan ha expirado',
    body: 'Tu suscripción ha terminado. Renueva para recuperar el acceso Premium.',
    data: { action: 'renew', daysRemaining: '0' }
  }
};

/**
 * Obtener tokens FCM de un usuario
 */
async function getUserFCMTokens(userId) {
  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data?.map(t => t.token) || [];
  } catch (error) {
    console.error(`Error obteniendo tokens FCM para usuario ${userId}:`, error);
    return [];
  }
}

/**
 * Enviar notificación push a un usuario
 */
async function sendPushNotification(userId, message) {
  if (!admin) {
    console.log(`📱 [MOCK] Push para usuario ${userId}: ${message.title}`);
    return { success: true, mock: true };
  }

  try {
    const tokens = await getUserFCMTokens(userId);
    
    if (tokens.length === 0) {
      console.log(`⚠️ Usuario ${userId} no tiene tokens FCM activos`);
      return { success: false, reason: 'no_tokens' };
    }

    const payload = {
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data,
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    
    console.log(`✅ Push enviado a usuario ${userId}: ${response.successCount}/${tokens.length} exitosos`);
    
    // Marcar tokens inválidos como inactivos
    if (response.failureCount > 0) {
      response.responses.forEach(async (resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          await supabase
            .from('fcm_tokens')
            .update({ is_active: false })
            .eq('token', tokens[idx]);
        }
      });
    }

    return { success: true, sent: response.successCount };
  } catch (error) {
    console.error(`Error enviando push a usuario ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Registrar notificación enviada (para evitar spam)
 */
async function logNotificationSent(userId, type, daysRemaining) {
  try {
    await supabase.from('renewal_notifications_log').insert({
      user_id: userId,
      notification_type: type,
      days_remaining: daysRemaining,
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    // Tabla puede no existir, ignorar
    console.log('⚠️ No se pudo registrar notificación (tabla puede no existir)');
  }
}

/**
 * Verificar si ya se envió notificación hoy
 */
async function wasNotificationSentToday(userId, daysRemaining) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('renewal_notifications_log')
      .select('id')
      .eq('user_id', userId)
      .eq('days_remaining', daysRemaining)
      .gte('sent_at', today.toISOString())
      .limit(1);

    if (error) return false; // Asumir no enviada si hay error
    return data && data.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Procesar recordatorios de renovación
 * Debe ejecutarse diariamente (cron job o similar)
 */
async function processRenewalReminders() {
  console.log('🔄 Procesando recordatorios de renovación...');
  
  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0
  };

  // Procesar cada tipo de recordatorio (7, 3, 1, 0 días)
  for (const days of [7, 3, 1]) {
    try {
      const users = await subscriptionService.getExpiringSubscriptions(days);
      console.log(`📅 ${users.length} usuarios con suscripción expirando en ${days} días`);

      for (const user of users) {
        results.processed++;
        
        // Verificar si ya se envió hoy
        const alreadySent = await wasNotificationSentToday(user.id, days);
        if (alreadySent) {
          results.skipped++;
          continue;
        }

        // Enviar notificación
        const message = RENEWAL_MESSAGES[days];
        const result = await sendPushNotification(user.id, message);
        
        if (result.success) {
          results.sent++;
          await logNotificationSent(user.id, 'renewal_reminder', days);
        } else {
          results.errors++;
        }
      }
    } catch (error) {
      console.error(`Error procesando recordatorios de ${days} días:`, error);
      results.errors++;
    }
  }

  // Procesar suscripciones expiradas (degradar a Free y notificar)
  try {
    const expiredUsers = await subscriptionService.getExpiredSubscriptions();
    console.log(`❌ ${expiredUsers.length} usuarios con suscripción expirada`);

    for (const user of expiredUsers) {
      results.processed++;

      // Degradar a Free
      await supabase
        .from('users')
        .update({
          subscription_plan_id: 'free',
          subscription_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Enviar notificación
      const message = RENEWAL_MESSAGES[0];
      const result = await sendPushNotification(user.id, message);
      
      if (result.success) {
        results.sent++;
        await logNotificationSent(user.id, 'subscription_expired', 0);
      }
    }
  } catch (error) {
    console.error('Error procesando suscripciones expiradas:', error);
    results.errors++;
  }

  console.log(`✅ Recordatorios procesados: ${results.processed}, Enviados: ${results.sent}, Omitidos: ${results.skipped}, Errores: ${results.errors}`);
  return results;
}

module.exports = {
  processRenewalReminders,
  sendPushNotification,
  RENEWAL_MESSAGES
};
