// src/controllers/verificationController.js
const { supabase } = require('../config/database');
const smsService = require('../services/smsService');

// Tiempo de expiración del código (5 minutos)
const CODE_EXPIRY_MINUTES = 5;
// Máximo de intentos
const MAX_ATTEMPTS = 3;
// Cooldown entre envíos (60 segundos)
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Enviar código de verificación
 * POST /api/verify/send-code
 * Body: { phone }
 */
async function sendVerificationCode(req, res) {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono requerido',
        message: 'Debes proporcionar un número de teléfono'
      });
    }
    
    // Limpiar y validar número
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (!smsService.isValidPeruvianPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Número inválido',
        message: 'Ingresa un número de celular peruano válido (9 dígitos, empezando con 9)'
      });
    }
    
    // Verificar si el teléfono ya está registrado
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .single();
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Teléfono ya registrado',
        message: 'Este número ya está asociado a una cuenta'
      });
    }
    
    // Verificar cooldown (no enviar muchos SMS seguidos)
    const { data: recentVerification } = await supabase
      .from('phone_verifications')
      .select('created_at')
      .eq('phone', cleanPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentVerification) {
      const lastSent = new Date(recentVerification.created_at);
      const now = new Date();
      const secondsSinceLastSend = (now - lastSent) / 1000;
      
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
        return res.status(429).json({
          success: false,
          error: 'Espera antes de reenviar',
          message: `Puedes solicitar otro código en ${waitSeconds} segundos`,
          retryAfter: waitSeconds
        });
      }
    }
    
    // Generar código OTP
    const code = smsService.generateOTP();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
    
    // Guardar código en base de datos
    const { error: dbError } = await supabase
      .from('phone_verifications')
      .insert({
        phone: cleanPhone,
        code: code,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      });
    
    if (dbError) {
      console.error('Error guardando código:', dbError);
      throw dbError;
    }
    
    // Enviar SMS
    const smsResult = await smsService.sendVerificationSMS(cleanPhone, code);
    
    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Error al enviar SMS',
        message: smsResult.error || 'No se pudo enviar el código de verificación'
      });
    }
    
    console.log(`📱 Código enviado a ${cleanPhone} (expira en ${CODE_EXPIRY_MINUTES} min)`);
    
    res.json({
      success: true,
      message: 'Código de verificación enviado',
      data: {
        phone: cleanPhone,
        expiresIn: CODE_EXPIRY_MINUTES * 60, // segundos
        simulated: smsResult.simulated || false
      }
    });
    
  } catch (error) {
    console.error('Error en sendVerificationCode:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar código',
      message: 'Hubo un problema al enviar el código de verificación'
    });
  }
}

/**
 * Verificar código
 * POST /api/verify/verify-code
 * Body: { phone, code }
 */
async function verifyCode(req, res) {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos',
        message: 'Teléfono y código son requeridos'
      });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCode = code.trim();
    
    // Buscar el código más reciente para este teléfono
    const { data: verification, error } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !verification) {
      return res.status(404).json({
        success: false,
        error: 'Código no encontrado',
        message: 'No hay un código pendiente para este número. Solicita uno nuevo.'
      });
    }
    
    // Verificar si expiró
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Código expirado',
        message: 'El código ha expirado. Solicita uno nuevo.'
      });
    }
    
    // Verificar intentos
    if (verification.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error: 'Demasiados intentos',
        message: 'Has excedido el número de intentos. Solicita un nuevo código.'
      });
    }
    
    // Verificar código
    if (verification.code !== cleanCode) {
      // Incrementar intentos
      await supabase
        .from('phone_verifications')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);
      
      const remainingAttempts = MAX_ATTEMPTS - verification.attempts - 1;
      
      return res.status(400).json({
        success: false,
        error: 'Código incorrecto',
        message: `Código incorrecto. Te quedan ${remainingAttempts} intento(s).`,
        remainingAttempts
      });
    }
    
    // Código correcto - marcar como verificado
    await supabase
      .from('phone_verifications')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', verification.id);
    
    console.log(`✅ Teléfono verificado: ${cleanPhone}`);
    
    // Generar token temporal de verificación (válido por 10 minutos)
    const jwt = require('jsonwebtoken');
    const verificationToken = jwt.sign(
      { phone: cleanPhone, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    
    res.json({
      success: true,
      message: 'Teléfono verificado correctamente',
      data: {
        phone: cleanPhone,
        verified: true,
        verificationToken // Token para usar en el registro
      }
    });
    
  } catch (error) {
    console.error('Error en verifyCode:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar',
      message: 'Hubo un problema al verificar el código'
    });
  }
}

/**
 * Verificar si un teléfono está disponible
 * GET /api/verify/check-phone?phone=xxx
 */
async function checkPhoneAvailability(req, res) {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono requerido'
      });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validar formato
    if (!smsService.isValidPeruvianPhone(cleanPhone)) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: 'invalid_format',
          message: 'Número de teléfono inválido'
        }
      });
    }
    
    // Verificar si existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .single();
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        reason: existingUser ? 'already_registered' : null,
        message: existingUser ? 'Este número ya está registrado' : 'Número disponible'
      }
    });
    
  } catch (error) {
    console.error('Error en checkPhoneAvailability:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar disponibilidad'
    });
  }
}

module.exports = {
  sendVerificationCode,
  verifyCode,
  checkPhoneAvailability
};
