// src/controllers/testController.js
const { supabase } = require('../config/database');
const fcmService = require('../services/fcmService');

/**
 * 🧪 Simular notificación de Yape/Plin
 * POST /api/test/simulate-notification
 * 
 * Body:
 * {
 *   "store_id": "uuid",
 *   "amount": 50.00,
 *   "sender_name": "Juan Pérez",
 *   "source": "yape" | "plin",
 *   "format": 1-4  // Opcional: formato de mensaje a simular
 * }
 */
async function simulateNotification(req, res) {
  try {
    const { 
      store_id, 
      amount = 50.00, 
      sender_name = 'Cliente Prueba', 
      source = 'yape',
      format = 1 
    } = req.body;

    // Validar store_id
    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id es requerido',
        message: 'Debes proporcionar el ID de la tienda'
      });
    }

    // Verificar que la tienda existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, owner_id')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return res.status(404).json({
        success: false,
        error: 'Tienda no encontrada',
        message: `No existe una tienda con ID: ${store_id}`
      });
    }

    // Generar mensaje simulado según formato
    const messages = generateSimulatedMessages(amount, sender_name, source, format);

    console.log('🧪 SIMULANDO NOTIFICACIÓN:');
    console.log(`   💰 Monto: S/ ${amount}`);
    console.log(`   👤 De: ${sender_name}`);
    console.log(`   📱 Fuente: ${source}`);
    console.log(`   📝 Formato: ${format}`);
    console.log(`   🏪 Tienda: ${store.name}`);

    // Crear notificación en BD (como si viniera de la app)
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        store_id,
        amount: parseFloat(amount),
        sender_name,
        source,
        message: messages.fullText,
        notification_timestamp: new Date().toISOString(),
        processed: false,
        workers_notified: 0,
        raw_data: {
          title: messages.title,
          text: messages.text,
          big_text: messages.bigText,
          simulated: true,
          format: format
        }
      })
      .select('*')
      .single();

    if (createError) {
      console.error('❌ Error al crear notificación simulada:', createError);
      throw createError;
    }

    console.log(`✅ Notificación creada con ID: ${notification.id}`);

    // Obtener trabajadores activos de la tienda
    const { data: workers } = await supabase
      .from('workers')
      .select('user_id, users!inner(name, phone)')
      .eq('store_id', store_id)
      .eq('is_active', true);

    const workerIds = workers?.map(w => w.user_id) || [];
    console.log(`👷 Trabajadores activos en la tienda: ${workerIds.length}`);

    // ⭐ AGREGAR EL OWNER A LA LISTA DE USUARIOS A NOTIFICAR
    const userIdsToNotify = [...workerIds];
    let ownerIncluded = false;
    if (store.owner_id && !userIdsToNotify.includes(store.owner_id)) {
      userIdsToNotify.push(store.owner_id);
      ownerIncluded = true;
      console.log(`👤 Owner agregado a la lista de notificaciones`);
    }

    // Obtener tokens FCM (workers + owner)
    const { data: fcmTokens } = await supabase
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', userIdsToNotify)
      .eq('is_active', true);

    const tokens = fcmTokens?.map(t => t.token) || [];
    const workerTokens = fcmTokens?.filter(t => workerIds.includes(t.user_id)).length || 0;
    const ownerTokens = ownerIncluded ? (tokens.length - workerTokens) : 0;
    console.log(`🔔 Tokens FCM encontrados: ${tokens.length} total (${workerTokens} workers + ${ownerTokens} owner)`);

    // Enviar notificaciones push
    let workersNotified = 0;
    let fcmResult = null;

    if (tokens.length > 0) {
      try {
        fcmResult = await fcmService.sendNotification({
          tokens,
          title: `💰 Nuevo pago en ${store.name}`,
          body: `${sender_name} te envió S/ ${amount} (PRUEBA)`,
          data: {
            notification_id: notification.id,
            store_id,
            amount: amount.toString(),
            source,
            type: 'payment_received',
            simulated: 'true'
          }
        });

        workersNotified = fcmResult.successCount || 0;
        console.log(`✅ Notificación FCM enviada exitosamente a ${workersNotified} dispositivo(s)`);
        
        if (fcmResult.failureCount > 0) {
          console.log(`⚠️ ${fcmResult.failureCount} notificación(es) fallaron al enviarse`);
          
          // 🧹 Desactivar tokens inválidos en la base de datos
          if (fcmResult.responses) {
            const invalidTokens = [];
            fcmResult.responses.forEach((resp, idx) => {
              if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                invalidTokens.push(tokens[idx]);
              }
            });
            
            if (invalidTokens.length > 0) {
              console.log(`🗑️ Desactivando ${invalidTokens.length} token(s) inválido(s)...`);
              await supabase
                .from('fcm_tokens')
                .update({ is_active: false })
                .in('token', invalidTokens);
              console.log(`✅ Tokens inválidos desactivados`);
            }
          }
        }
      } catch (fcmError) {
        console.error('❌ Error al enviar FCM:', fcmError);
      }
    } else {
      console.log('⚠️ No hay tokens FCM disponibles');
    }

    // Actualizar notificación
    await supabase
      .from('notifications')
      .update({
        processed: true,
        workers_notified: workersNotified
      })
      .eq('id', notification.id);

    // Respuesta detallada
    res.status(201).json({
      success: true,
      message: '🧪 Notificación simulada exitosamente',
      data: {
        notification: {
          id: notification.id,
          amount: notification.amount,
          sender_name: notification.sender_name,
          source: notification.source,
          created_at: notification.created_at,
          workers_notified: workersNotified
        },
        simulation: {
          format_used: format,
          messages: messages,
          store: {
            id: store.id,
            name: store.name
          },
          workers: {
            total: workers?.length || 0,
            notified: workersNotified,
            tokens_available: tokens.length
          }
        },
        fcm_result: fcmResult ? {
          success_count: fcmResult.successCount,
          failure_count: fcmResult.failureCount
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error en simulateNotification:', error);
    res.status(500).json({
      success: false,
      error: 'Error al simular notificación',
      message: error.message
    });
  }
}

/**
 * Generar mensajes simulados en diferentes formatos
 */
function generateSimulatedMessages(amount, senderName, source, format) {
  const formattedAmount = parseFloat(amount).toFixed(2);
  const sourceName = source === 'yape' ? 'Yape' : 'Plin';
  const verb = source === 'yape' ? 'yapeó' : 'plineó';
  
  let title = '';
  let text = '';
  let bigText = '';

  switch (format) {
    case 1:
      // Formato: "Recibiste S/ XX.XX"
      title = `Recibiste un ${sourceName}`;
      text = `Recibiste S/ ${formattedAmount}`;
      bigText = `${senderName} te envió S/ ${formattedAmount} por ${sourceName}`;
      break;

    case 2:
      // Formato: "S/ XX.XX de Nombre"
      title = `Nuevo pago de ${senderName}`;
      text = `S/ ${formattedAmount} de ${senderName}`;
      bigText = `¡${senderName} te ${verb} S/ ${formattedAmount}! 💰`;
      break;

    case 3:
      // Formato: "Te yapeó/plineó S/ XX.XX"
      title = `${senderName}`;
      text = `Te ${verb} S/ ${formattedAmount}`;
      bigText = `${senderName} te ${verb} S/ ${formattedAmount}. ¡Revisa tu saldo!`;
      break;

    case 4:
      // Formato: Solo monto
      title = `${sourceName}`;
      text = `S/ ${formattedAmount}`;
      bigText = `Recibiste S/ ${formattedAmount} de ${senderName}`;
      break;

    default:
      // Formato 1 por defecto
      title = `Recibiste un ${sourceName}`;
      text = `Recibiste S/ ${formattedAmount}`;
      bigText = `${senderName} te envió S/ ${formattedAmount}`;
  }

  return {
    title,
    text,
    bigText,
    fullText: `${title} ${text} ${bigText}`
  };
}

/**
 * 🧪 Simular múltiples notificaciones (batch)
 * POST /api/test/simulate-batch
 * 
 * Body:
 * {
 *   "store_id": "uuid",
 *   "count": 5,  // Número de notificaciones a crear
 *   "min_amount": 10.00,
 *   "max_amount": 500.00,
 *   "sources": ["yape", "plin"],  // Aleatorio entre estos
 *   "delay_ms": 1000  // Delay entre cada notificación
 * }
 */
async function simulateBatch(req, res) {
  try {
    const {
      store_id,
      count = 5,
      min_amount = 10.00,
      max_amount = 500.00,
      sources = ['yape', 'plin'],
      delay_ms = 1000
    } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id es requerido'
      });
    }

    // Verificar tienda
    const { data: store } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', store_id)
      .single();

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Tienda no encontrada'
      });
    }

    console.log(`🧪 INICIANDO SIMULACIÓN BATCH:`);
    console.log(`   📊 Cantidad: ${count} notificaciones`);
    console.log(`   💰 Rango: S/ ${min_amount} - S/ ${max_amount}`);
    console.log(`   📱 Fuentes: ${sources.join(', ')}`);
    console.log(`   ⏱️ Delay: ${delay_ms}ms`);

    const results = [];
    const names = [
      'Juan Pérez',
      'María García',
      'Carlos López',
      'Ana Martínez',
      'José Rodríguez',
      'Carmen Silva',
      'Luis Torres',
      'Rosa Flores',
      'Pedro Ramírez',
      'Laura Mendoza'
    ];

    // Enviar respuesta inmediatamente y procesar en background
    res.status(202).json({
      success: true,
      message: `🧪 Iniciando simulación de ${count} notificaciones`,
      data: {
        store_id,
        store_name: store.name,
        count,
        estimated_duration_seconds: (count * delay_ms) / 1000
      }
    });

    // Procesar en background
    (async () => {
      for (let i = 0; i < count; i++) {
        const amount = (Math.random() * (max_amount - min_amount) + min_amount).toFixed(2);
        const sender_name = names[Math.floor(Math.random() * names.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const format = Math.floor(Math.random() * 4) + 1;

        const messages = generateSimulatedMessages(amount, sender_name, source, format);

        const { data: notification } = await supabase
          .from('notifications')
          .insert({
            store_id,
            amount: parseFloat(amount),
            sender_name,
            source,
            message: messages.fullText,
            notification_timestamp: new Date().toISOString(),
            processed: true,
            workers_notified: 0,
            raw_data: {
              title: messages.title,
              text: messages.text,
              big_text: messages.bigText,
              simulated: true,
              batch: true,
              format: format
            }
          })
          .select('id')
          .single();

        console.log(`✅ [${i + 1}/${count}] Notificación creada: S/ ${amount} de ${sender_name}`);
        
        results.push({
          id: notification?.id,
          amount,
          sender_name,
          source
        });

        // Delay entre notificaciones
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, delay_ms));
        }
      }

      console.log(`🎉 Simulación batch completada: ${results.length} notificaciones creadas`);
    })();

  } catch (error) {
    console.error('❌ Error en simulateBatch:', error);
    res.status(500).json({
      success: false,
      error: 'Error al simular batch',
      message: error.message
    });
  }
}

/**
 * 🧪 Obtener listado de tiendas para testing
 * GET /api/test/stores
 */
async function getTestStores(req, res) {
  try {
    // Obtener tiendas
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, address, owner_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (storesError) throw storesError;

    // Enriquecer con información del owner y trabajadores
    const formattedStores = [];
    
    for (const store of stores || []) {
      // Obtener owner
      const { data: owner } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', store.owner_id)
        .single();

      // Obtener trabajadores activos
      const { data: workers } = await supabase
        .from('workers')
        .select('id, user_id, is_active')
        .eq('store_id', store.id)
        .eq('is_active', true);

      // Obtener información de cada trabajador
      const workerDetails = [];
      for (const worker of workers || []) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', worker.user_id)
          .single();
        
        if (userData) {
          workerDetails.push({
            name: userData.name,
            phone: userData.phone
          });
        }
      }

      formattedStores.push({
        id: store.id,
        name: store.name,
        address: store.address,
        owner: {
          name: owner?.name || 'N/A',
          email: owner?.email || 'N/A',
          phone: owner?.phone || 'N/A'
        },
        workers_count: workerDetails.length,
        workers: workerDetails
      });
    }

    res.json({
      success: true,
      data: {
        stores: formattedStores,
        count: formattedStores.length
      }
    });

  } catch (error) {
    console.error('❌ Error en getTestStores:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tiendas',
      message: error.message
    });
  }
}

module.exports = {
  simulateNotification,
  simulateBatch,
  getTestStores
};
