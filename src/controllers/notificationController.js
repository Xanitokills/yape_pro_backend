// src/controllers/notificationController.js
const { supabase } = require('../config/database');
const fcmService = require('../services/fcmService');
const notificationParser = require('../services/notificationParser');

/**
 * Obtener notificaciones de una tienda
 * GET /api/notifications?store_id=xxx&limit=20&offset=0
 */
async function getNotifications(req, res) {
  try {
    const { store_id, limit = 50, offset = 0 } = req.query;
    const userId = req.user.userId;
    const role = req.user.role;
    
    if (!store_id) {
      return res.status(400).json({
        error: 'store_id requerido',
        message: 'Debes proporcionar el ID de la tienda'
      });
    }
    
    // Verificar acceso a la tienda
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .single();
    
    if (!store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    if (role === 'worker') {
      // Verificar que trabaja en esta tienda
      const { data: worker } = await supabase
        .from('workers')
        .select('id')
        .eq('store_id', store_id)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (!worker) {
        return res.status(403).json({
          error: 'Acceso denegado'
        });
      }
    }
    
    // Obtener notificaciones
    const { data: notifications, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id)
      .order('notification_timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    if (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
    
    res.json({
      success: true,
      data: {
        notifications: notifications || [],
        count: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Error en getNotifications:', error);
    res.status(500).json({
      error: 'Error al obtener notificaciones',
      message: 'No se pudieron cargar las notificaciones'
    });
  }
}

/**
 * Crear y enviar notificación
 * POST /api/notifications
 */
async function createNotification(req, res) {
  try {
    const { store_id, amount, sender_name, source, message, notification_timestamp } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;
    
    // Validaciones
    if (!store_id || !amount || !source) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'store_id, amount y source son requeridos'
      });
    }
    
    // Verificar acceso a la tienda
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id, name')
      .eq('id', store_id)
      .single();
    
    if (!store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }

    // 🔥 VERIFICAR LÍMITE DE TRANSACCIONES DEL PLAN
    const subscriptionService = require('../services/subscriptionService');
    try {
      await subscriptionService.recordTransaction(store.owner_id);
    } catch (limitError) {
      return res.status(403).json({
        success: false,
        error: 'PLAN_LIMIT_REACHED',
        message: limitError.message,
        upgradeRequired: true
      });
    }

    // 🔒 VERIFICAR DUPLICADOS (misma tienda, monto, remitente en últimos 30 segundos)
    const timestamp = notification_timestamp || new Date().toISOString();
    const thirtySecondsAgo = new Date(new Date(timestamp).getTime() - 30000).toISOString();
    
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('store_id', store_id)
      .eq('amount', parseFloat(amount))
      .eq('sender_name', sender_name || '')
      .gte('notification_timestamp', thirtySecondsAgo)
      .single();

    if (existingNotification) {
      console.log(`⚠️ Notificación duplicada detectada para tienda ${store_id}, monto ${amount}, remitente ${sender_name}`);
      return res.status(200).json({
        success: true,
        message: 'Notificación ya registrada (duplicado ignorado)',
        notification: existingNotification,
        duplicate: true
      });
    }
    
    // Crear notificación en BD
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        store_id,
        amount: parseFloat(amount),
        sender_name,
        source,
        message,
        notification_timestamp: notification_timestamp || new Date().toISOString(),
        processed: false,
        workers_notified: 0
      })
      .select('*')
      .single();
    
    if (createError) {
      console.error('Error al crear notificación:', createError);
      throw createError;
    }
    
    // Obtener trabajadores activos de la tienda
    const { data: workers } = await supabase
      .from('workers')
      .select('user_id')
      .eq('store_id', store_id)
      .eq('is_active', true);
    
    const workerIds = workers?.map(w => w.user_id) || [];
    
    console.log(`👷 Workers encontrados: ${workerIds.length}`);
    workerIds.forEach((id, idx) => console.log(`   Worker ${idx + 1}: ${id}`));
    
    // ⭐ AGREGAR EL OWNER A LA LISTA DE USUARIOS A NOTIFICAR
    const userIdsToNotify = [...workerIds];
    if (store.owner_id && !userIdsToNotify.includes(store.owner_id)) {
      userIdsToNotify.push(store.owner_id);
    }
    
    console.log(`📢 Total usuarios a notificar: ${userIdsToNotify.length}`);
    userIdsToNotify.forEach((id, idx) => console.log(`   ${idx + 1}. ${id}`));
    
    // Obtener tokens FCM de los trabajadores + owner
    const { data: fcmTokens } = await supabase
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', userIdsToNotify)
      .eq('is_active', true);
    
    const tokens = fcmTokens?.map(t => t.token) || [];
    
    console.log(`📱 Tokens FCM encontrados: ${tokens.length}`);
    console.log(`👥 Usuarios a notificar: ${userIdsToNotify.length}`);
    
    // Enviar notificaciones push
    let workersNotified = 0;
    if (tokens.length > 0) {
      try {
        console.log(`📤 Enviando notificación a ${tokens.length} dispositivo(s)...`);
        
        const result = await fcmService.sendNotification({
          tokens,
          title: `💰 Nuevo pago en ${store.name}`,
          body: `${sender_name || 'Alguien'} te envió S/ ${amount}`,
          data: {
            notification_id: notification.id,
            store_id,
            amount: amount.toString(),
            source,
            type: 'payment_received'
          }
        });
        
        console.log(`✅ Enviados exitosamente: ${result.successCount}`);
        console.log(`❌ Fallidos: ${result.failureCount}`);
        
        workersNotified = result.successCount || 0;
        
        // 🧹 Desactivar tokens inválidos
        if (result.failureCount > 0 && result.responses) {
          const invalidTokens = [];
          result.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
              invalidTokens.push(tokens[idx]);
              console.log(`❌ Token inválido [${idx}]: ${tokens[idx].substring(0, 20)}...`);
            }
          });
          
          if (invalidTokens.length > 0) {
            console.log(`🗑️ Desactivando ${invalidTokens.length} token(s) inválido(s)...`);
            await supabase
              .from('fcm_tokens')
              .update({ is_active: false })
              .in('token', invalidTokens);
            console.log('✅ Tokens inválidos desactivados');
          }
        } else if (result.failureCount === 0) {
          console.log('✅ Todos los tokens son válidos');
        }
      } catch (fcmError) {
        console.error('Error al enviar notificaciones FCM:', fcmError);
        // No lanzar error, solo registrar
      }
    }
    
    // Actualizar contador de trabajadores notificados
    await supabase
      .from('notifications')
      .update({
        processed: true,
        workers_notified: workersNotified
      })
      .eq('id', notification.id);
    
    res.status(201).json({
      success: true,
      message: 'Notificación creada y enviada',
      data: {
        notification: {
          ...notification,
          workers_notified: workersNotified
        }
      }
    });
    
  } catch (error) {
    console.error('Error en createNotification:', error);
    res.status(500).json({
      error: 'Error al crear notificación',
      message: 'No se pudo crear la notificación'
    });
  }
}

/**
 * Parsear notificación desde texto (SMS, captura)
 * POST /api/notifications/parse
 */
async function parseNotification(req, res) {
  try {
    const { text, store_id, country } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Texto requerido',
        message: 'Debes proporcionar el texto a parsear'
      });
    }
    
    // 🌎 Obtener el país del usuario si no se proporciona
    let userCountry = country || 'PE'; // Por defecto Perú
    
    if (!country && req.userId) {
      const { data: user } = await supabase
        .from('users')
        .select('country')
        .eq('id', req.userId)
        .single();
      
      if (user && user.country) {
        userCountry = user.country;
      }
    }
    
    // Parsear el texto con el país del usuario
    const parsed = notificationParser.parse(text, userCountry);
    
    if (!parsed) {
      return res.status(400).json({
        error: 'No se pudo parsear',
        message: 'El texto no parece ser una notificación de pago válida'
      });
    }
    
    // Si se proporciona store_id, crear la notificación automáticamente
    if (store_id) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', store_id)
        .single();
      
      if (!store) {
        return res.status(404).json({
          error: 'Tienda no encontrada'
        });
      }
      
      if (req.user.role === 'owner' && store.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Acceso denegado'
        });
      }
      
      // Crear notificación
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          store_id,
          amount: parsed.amount,
          sender_name: parsed.sender,
          source: parsed.source,
          message: text,
          notification_timestamp: new Date().toISOString()
        })
        .select('*')
        .single();
      
      return res.json({
        success: true,
        message: 'Notificación parseada y creada',
        data: {
          parsed,
          notification
        }
      });
    }
    
    // Solo retornar datos parseados
    res.json({
      success: true,
      message: 'Notificación parseada exitosamente',
      data: { parsed }
    });
    
  } catch (error) {
    console.error('Error en parseNotification:', error);
    res.status(500).json({
      error: 'Error al parsear notificación',
      message: 'No se pudo procesar el texto'
    });
  }
}

/**
 * Obtener estadísticas de notificaciones
 * GET /api/notifications/stats?store_id=xxx&days=30
 */
async function getNotificationStats(req, res) {
  try {
    const { store_id, days = 30 } = req.query;
    const userId = req.user.userId;
    const role = req.user.role;
    
    if (!store_id) {
      return res.status(400).json({
        error: 'store_id requerido'
      });
    }
    
    // Verificar acceso
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', store_id)
      .single();
    
    if (!store) {
      return res.status(404).json({
        error: 'Tienda no encontrada'
      });
    }
    
    if (role === 'owner' && store.owner_id !== userId) {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }
    
    // Fecha límite
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Obtener notificaciones del período
    const { data: notifications } = await supabase
      .from('notifications')
      .select('amount, source, notification_timestamp')
      .eq('store_id', store_id)
      .gte('notification_timestamp', startDate.toISOString());
    
    if (!notifications) {
      return res.json({
        success: true,
        data: {
          stats: {
            total_notifications: 0,
            total_amount: 0,
            by_source: {},
            average_amount: 0
          }
        }
      });
    }
    
    // Calcular estadísticas
    const totalAmount = notifications.reduce((sum, n) => sum + parseFloat(n.amount), 0);
    const bySource = notifications.reduce((acc, n) => {
      acc[n.source] = (acc[n.source] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        stats: {
          total_notifications: notifications.length,
          total_amount: totalAmount.toFixed(2),
          by_source: bySource,
          average_amount: (totalAmount / notifications.length).toFixed(2),
          period_days: parseInt(days)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getNotificationStats:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: 'No se pudieron cargar las estadísticas'
    });
  }
}

/**
 * Obtener última notificación para ESP32
 * GET /api/notifications/latest?store_id=xxx&limit=4
 */
async function getLatestNotification(req, res) {
  try {
    const { store_id, limit = 1 } = req.query;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id requerido'
      });
    }
    
    const limitNum = Math.min(parseInt(limit), 10); // Máximo 10 notificaciones
    
    // Obtener las últimas notificaciones procesadas
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('store_id', store_id)
      .eq('processed', true)
      .order('notification_timestamp', { ascending: false })
      .limit(limitNum);
    
    if (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
    
    if (!notifications || notifications.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No hay notificaciones disponibles'
      });
    }
    
    // Si solo se pidió 1, devolver objeto único (compatibilidad)
    if (limitNum === 1) {
      res.json({
        success: true,
        data: {
          id: notifications[0].id,
          amount: notifications[0].amount,
          sender_name: notifications[0].sender_name,
          source: notifications[0].source,
          timestamp: notifications[0].notification_timestamp,
          workers_notified: notifications[0].workers_notified
        }
      });
    } else {
      // Devolver array de notificaciones
      res.json({
        success: true,
        data: notifications.map(n => ({
          id: n.id,
          amount: n.amount,
          sender_name: n.sender_name,
          source: n.source,
          timestamp: n.notification_timestamp,
          workers_notified: n.workers_notified
        })),
        count: notifications.length
      });
    }
    
  } catch (error) {
    console.error('Error en getLatestNotification:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificación',
      message: error.message
    });
  }
}

module.exports = {
  getNotifications,
  createNotification,
  parseNotification,
  getNotificationStats,
  getLatestNotification
};
