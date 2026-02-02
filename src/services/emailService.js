const nodemailer = require('nodemailer');

// Crear transporter dinámicamente para cada envío (evita problemas de timeout)
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 5000,
    socketTimeout: 20000
  });
}

/**
 * Envía un código de verificación por email para recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @param {string} userName - Nombre del usuario (opcional)
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(email, code, userName = '') {
  const transporter = createTransporter(); // Crear transporter fresco
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
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperación enviado a: ${email}`);
    transporter.close(); // Cerrar conexión
  } catch (error) {
    transporter.close();
    console.error('Error al enviar email:', error);
    throw new Error('No se pudo enviar el email de recuperación');
  }
}

/**
 * Envía un código de verificación por email para registro
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise<void>}
 */
async function sendEmailVerificationCode(email, code) {
  const transporter = createTransporter(); // Crear transporter fresco
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Codigo de verificacion - Pago Seguro',
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
            <h2>Verifica tu Email</h2>
            <p>Gracias por registrarte en Pago Seguro.</p>
            <p>Tu codigo de verificacion es:</p>
            <div class="code">${code}</div>
            <p>Este codigo es valido por <strong>10 minutos</strong>.</p>
            <div class="warning">
              <strong>Importante:</strong> Nunca compartas este codigo con nadie. El equipo de Pago Seguro nunca te pedira este codigo.
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automatico, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Pago Seguro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de verificacion enviado a: ${email}`);
    transporter.close(); // Cerrar conexión
  } catch (error) {
    transporter.close();
    console.error('Error al enviar email de verificacion:', error);
    throw new Error('No se pudo enviar el email de verificacion');
  }
}

// Exportar todas las funciones al final del archivo
module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationCode
};
