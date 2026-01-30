// test-email.js - Prueba del servicio de email
require('dotenv').config();
const { verifyEmailConfig, sendPasswordResetEmail } = require('./src/services/emailService');

async function test() {
  console.log('📧 Verificando configuración de email...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Configurada' : '✗ No configurada');
  console.log('');
  
  const isConfigured = await verifyEmailConfig();
  
  if (isConfigured) {
    console.log('');
    console.log('✅ Configuración correcta!');
    console.log('');
    console.log('🧪 Enviando email de prueba...');
    
    try {
      await sendPasswordResetEmail(
        process.env.EMAIL_USER,
        '123456',
        'Usuario de Prueba'
      );
      console.log('✅ Email de prueba enviado correctamente!');
      console.log('📬 Revisa tu bandeja de entrada:', process.env.EMAIL_USER);
    } catch (error) {
      console.error('❌ Error al enviar email:', error.message);
    }
  } else {
    console.error('❌ Error en la configuración de email');
  }
}

test();
