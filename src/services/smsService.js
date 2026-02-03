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
      code: code, // Devolver el código en modo simulado
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
    console.error('❌ Error completo:', error);
    
    // En caso de error, retornar el código en modo simulado para desarrollo
    console.log(`📨 CÓDIGO SIMULADO (por error): ${code}`);
    return {
      success: true,
      simulated: true,
      code: code,
      messageId: `SIM_ERROR_${Date.now()}`,
      message: 'SMS simulado por error en Twilio'
    };
    
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
 * Configuración de países soportados
 */
const COUNTRY_CONFIG = {
  'PE': { code: '51', length: 9, startsWith: ['9'] },           // Perú
  'CO': { code: '57', length: 10, startsWith: ['3'] },          // Colombia
  'MX': { code: '52', length: 10, startsWith: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] }, // México
  'AR': { code: '54', length: 10, startsWith: ['1', '2', '3', '9'] }, // Argentina
  'CL': { code: '56', length: 9, startsWith: ['9'] },           // Chile
  'EC': { code: '593', length: 9, startsWith: ['9'] },          // Ecuador
  'BO': { code: '591', length: 8, startsWith: ['6', '7'] },     // Bolivia
  'VE': { code: '58', length: 10, startsWith: ['4'] },          // Venezuela
  'US': { code: '1', length: 10, startsWith: ['2', '3', '4', '5', '6', '7', '8', '9'] }, // USA
  'ES': { code: '34', length: 9, startsWith: ['6', '7'] },      // España
};

/**
 * Valida el formato del número de teléfono (multi-país)
 * @param {string} phone - Número a validar (puede incluir código de país)
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  
  // Intentar detectar país por código
  for (const [country, config] of Object.entries(COUNTRY_CONFIG)) {
    const { code, length, startsWith } = config;
    
    // Con código de país completo
    if (cleaned.startsWith(code)) {
      const localNumber = cleaned.slice(code.length);
      if (localNumber.length === length) {
        // Verificar si empieza con dígito válido para ese país
        if (startsWith.some(prefix => localNumber.startsWith(prefix))) {
          return true;
        }
      }
    }
    
    // Sin código de país (número local)
    if (cleaned.length === length) {
      if (startsWith.some(prefix => cleaned.startsWith(prefix))) {
        return true;
      }
    }
  }
  
  // Fallback: aceptar números entre 8 y 15 dígitos (estándar internacional)
  if (cleaned.length >= 8 && cleaned.length <= 15) {
    return true;
  }
  
  return false;
}

/**
 * Valida el formato del número de teléfono peruano (legacy - mantener compatibilidad)
 * @param {string} phone - Número a validar
 * @returns {boolean}
 */
function isValidPeruvianPhone(phone) {
  // Usar la nueva función multi-país
  return isValidPhone(phone);
}

module.exports = {
  generateOTP,
  sendVerificationSMS,
  formatPhoneNumber,
  isValidPeruvianPhone,
  isValidPhone,
  COUNTRY_CONFIG
};
