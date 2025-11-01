// src/services/fcmService.js
const { getMessaging, admin } = require('../config/firebase');

/**
 * Enviar notificación push a uno o múltiples dispositivos
 */
async function sendNotification({ tokens, title, body, data = {} }) {
  try {
    // Verificar que Firebase esté configurado
    const messaging = getMessaging();
    
    if (!messaging) {
      console.warn('Firebase no configurado. No se enviarán notificaciones push.');
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        error: 'Firebase no configurado'
      };
    }
    
    // Si es un solo token, convertir a array
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    if (tokenArray.length === 0) {
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        error: 'No hay tokens para enviar'
      };
    }
    
    // Construir el mensaje
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        // Asegurar que todos los datos sean strings
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'yape_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    // Enviar a múltiples tokens
    if (tokenArray.length === 1) {
      // Un solo token
      message.token = tokenArray[0];
      const response = await messaging.send(message);
      
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        messageId: response
      };
    } else {
      // Múltiples tokens
      const response = await messaging.sendEachForMulticast({
        ...message,
        tokens: tokenArray
      });
      
      // Manejar tokens inválidos
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: tokenArray[idx],
              error: resp.error?.code
            });
          }
        });
        
        console.warn('Algunos tokens fallaron:', failedTokens);
        
        // TODO: Aquí podrías desactivar tokens inválidos en la BD
        // await deactivateInvalidTokens(failedTokens);
      }
      
      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    }
    
  } catch (error) {
    console.error('Error enviando notificación FCM:', error);
    throw error;
  }
}

/**
 * Enviar notificación a un tema/topic
 */
async function sendToTopic({ topic, title, body, data = {} }) {
  try {
    const messaging = getMessaging();
    
    if (!messaging) {
      throw new Error('Firebase no configurado');
    }
    
    const message = {
      topic,
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };
    
    const response = await messaging.send(message);
    
    return {
      success: true,
      messageId: response
    };
    
  } catch (error) {
    console.error('Error enviando a topic:', error);
    throw error;
  }
}

/**
 * Suscribir tokens a un tema
 */
async function subscribeToTopic(tokens, topic) {
  try {
    const messaging = getMessaging();
    
    if (!messaging) {
      throw new Error('Firebase no configurado');
    }
    
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    const response = await messaging.subscribeToTopic(tokenArray, topic);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
    
  } catch (error) {
    console.error('Error suscribiendo a topic:', error);
    throw error;
  }
}

/**
 * Desuscribir tokens de un tema
 */
async function unsubscribeFromTopic(tokens, topic) {
  try {
    const messaging = getMessaging();
    
    if (!messaging) {
      throw new Error('Firebase no configurado');
    }
    
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    
    const response = await messaging.unsubscribeFromTopic(tokenArray, topic);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
    
  } catch (error) {
    console.error('Error desuscribiendo de topic:', error);
    throw error;
  }
}

module.exports = {
  sendNotification,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic
};
