// src/services/smsService.js
// Servicio de verificación SMS usando Twilio

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Cliente de Twilio (se inicializa solo si hay credenciales)
let twilioClient = null;

function initTwilio() {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && !twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio SMS Service inicializado');
  }
}

/**
 * Genera un código OTP de 6 dígitos
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Formatea el número de teléfono para Perú
 * @param {string} phone - Número sin código de país
 * @returns {string} Número con formato internacional +51XXXXXXXXX
 */
function formatPhoneNumber(phone) {
  // Limpiar el número (solo dígitos)
  const cleaned = phone.replace(/\D/g, '');
  
  // Si ya tiene código de país (51), usar como está
  if (cleaned.startsWith('51') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  
  // Si tiene 9 dígitos, agregar código de Perú
  if (cleaned.length === 9) {
    return `+51${cleaned}`;
  }
  
  // Retornar con + si no tiene
  return `+${cleaned}`;
}

/**
 * Envía un SMS con el código de verificación
 * @param {string} phone - Número de teléfono
 * @param {string} code - Código OTP
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendVerificationSMS(phone, code) {
  initTwilio();
  
  const formattedPhone = formatPhoneNumber(phone);
  
  console.log(`📱 Enviando SMS de verificación a ${formattedPhone}`);
  
  // Si no hay Twilio configurado, usar modo simulado
  if (!twilioClient) {
    console.log('⚠️ Twilio no configurado - Modo simulado');
    console.log(`📨 Código OTP para ${formattedPhone}: ${code}`);
    return {
      success: true,
      simulated: true,
      messageId: `SIM_${Date.now()}`,
      message: 'SMS simulado (configurar Twilio para producción)'
    };
  }
  
  try {
    const message = await twilioClient.messages.create({
      body: `🔐 Tu código de verificación YapePro es: ${code}\n\nNo compartas este código con nadie.`,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    console.log(`✅ SMS enviado - SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
    
  } catch (error) {
    console.error('❌ Error enviando SMS:', error.message);
    
    // Errores comunes de Twilio
    if (error.code === 21211) {
      return { success: false, error: 'Número de teléfono inválido' };
    }
    if (error.code === 21608) {
      return { success: false, error: 'Número no verificado en Twilio (modo trial)' };
    }
    if (error.code === 21614) {
      return { success: false, error: 'Número no puede recibir SMS' };
    }
    
    return {
      success: false,
      error: error.message || 'Error al enviar SMS'
    };
  }
}

/**
 * Valida el formato del número de teléfono peruano
 * @param {string} phone - Número a validar
 * @returns {boolean}
 */
function isValidPeruvianPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  
  // Número peruano: 9 dígitos empezando con 9
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return true;
  }
  
  // Con código de país: 519XXXXXXXX
  if (cleaned.length === 11 && cleaned.startsWith('519')) {
    return true;
  }
  
  return false;
}

module.exports = {
  generateOTP,
  sendVerificationSMS,
  formatPhoneNumber,
  isValidPeruvianPhone
};
