const nodemailer = require('nodemailer');

// Último intento: Puerto 465 SSL/TLS directo
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Función helper para enviar email con retry
async function sendEmailWithRetry(mailOptions, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt} de ${maxRetries} para enviar email a: ${mailOptions.to}`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`Email enviado exitosamente a: ${mailOptions.to}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`Intento ${attempt} fallo:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 1000;
        console.log(`Esperando ${waitTime}ms antes de reintentar...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
}

/**
 * Envía un código de verificación por email para recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @param {string} userName - Nombre del usuario (opcional)
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(email, code, userName = '') {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de recuperación de contraseña - Pago Seguro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #635bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #635bff;
            text-align: center;
            padding: 20px;
            background-color: #f6f9fc;
            border-radius: 5px;
            letter-spacing: 5px;
            margin: 20px 0;
          }
          .warning {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pago Seguro</h1>
          </div>
          <div class="content">
            <h2>Recuperación de Contraseña</h2>
            <p>Hola${userName ? ' ' + userName : ''},</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Tu código de verificación es:</p>
            <div class="code">${code}</div>
            <p>Este código es válido por <strong>15 minutos</strong>.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Nunca compartas este código con nadie. El equipo de Pago Seguro nunca te pedirá este código.
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Pago Seguro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailWithRetry(mailOptions);
    console.log(`Email de recuperacion enviado a: ${email}`);
  } catch (error) {
    console.error('Error al enviar email de recuperacion:', error);
    throw new Error('No se pudo enviar el email de recuperacion');
  }
}

/**
 * Envía un código de verificación por email para registro
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise<void>}
 */
async function sendEmailVerificationCode(email, code) {
  console.log(`🚀 [DEBUG] Copiando función que funciona para: ${email}`);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de verificación - Pago Seguro',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background-color: #635bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #635bff;
            text-align: center;
            padding: 20px;
            background-color: #f6f9fc;
            border-radius: 5px;
            letter-spacing: 5px;
            margin: 20px 0;
          }
          .warning {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pago Seguro</h1>
          </div>
          <div class="content">
            <h2>Verificación de Email</h2>
            <p>Hola,</p>
            <p>Gracias por registrarte. Para continuar, verifica tu email.</p>
            <p>Tu código de verificación es:</p>
            <div class="code">${code}</div>
            <p>Este código es válido por <strong>10 minutos</strong>.</p>
            <div class="warning">
              <strong>⚠️ Importante:</strong> Nunca compartas este código con nadie. El equipo de Pago Seguro nunca te pedirá este código.
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Pago Seguro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sendEmailWithRetry(mailOptions);
    console.log(`✅ Email de verificacion enviado a: ${email}`);
  } catch (error) {
    console.error('❌ Error al enviar email de verificacion:', error);
    throw new Error('No se pudo enviar el email de verificacion');
  }
}

// Exportar todas las funciones al final del archivo
module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationCode
};
