const nodemailer = require('nodemailer');

// Configurar el transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Usa una contraseña de aplicación de Gmail
  }
});

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
    subject: 'Código de recuperación de contraseña - Yape Pro',
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
            background-color: #4CAF50;
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
            color: #4CAF50;
            text-align: center;
            padding: 20px;
            background-color: #f0f0f0;
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
            <h1>Yape Pro</h1>
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
              <strong>⚠️ Importante:</strong> Nunca compartas este código con nadie. El equipo de Yape Pro nunca te pedirá este código.
            </div>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Yape Pro. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperación enviado a: ${email}`);
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new Error('No se pudo enviar el email de recuperación');
  }
}

/**
 * Verifica la configuración del servicio de email
 * @returns {Promise<boolean>}
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✓ Servicio de email configurado correctamente');
    return true;
  } catch (error) {
    console.error('✗ Error en la configuración del email:', error);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  verifyEmailConfig
};
