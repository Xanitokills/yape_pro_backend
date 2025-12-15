// Handlers para los callbacks de IziPay

/**
 * Callback de IziPay cuando el pago es exitoso
 * POST /api/payments/izipay-success
 */
exports.handleIzipaySuccess = async (req, res) => {
  try {
    console.log('✅ IziPay Success Callback recibido:', req.body);
    
    // Retornar página de éxito
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Exitoso</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 400px;
        }
        .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: #10b981;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        p {
            color: #666;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>¡Pago Exitoso!</h1>
        <p>Tu pago ha sido procesado correctamente.</p>
        <p style="font-size: 12px; color: #999;">Esta ventana se cerrará automáticamente...</p>
    </div>
    <script>
        setTimeout(function() {
            if (window.parent) {
                window.parent.postMessage({ type: 'CLOSE_PAYMENT' }, '*');
            }
        }, 2000);
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('❌ Error en handleIzipaySuccess:', error);
    res.status(500).send('Error procesando callback de éxito');
  }
};

/**
 * Callback de IziPay cuando el pago es rechazado
 * POST /api/payments/izipay-refused
 */
exports.handleIzipayRefused = async (req, res) => {
  try {
    console.log('❌ IziPay Refused Callback recibido:', req.body);
    
    // Retornar página de rechazo
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Rechazado</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 400px;
        }
        .error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        p {
            color: #666;
            margin: 10px 0;
        }
        button {
            margin-top: 20px;
            padding: 12px 24px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">❌</div>
        <h1>Pago Rechazado</h1>
        <p>No se pudo procesar tu pago.</p>
        <p style="font-size: 14px; color: #666;">Por favor, verifica los datos de tu tarjeta e intenta nuevamente.</p>
        <button onclick="closeWindow()">Cerrar</button>
    </div>
    <script>
        function closeWindow() {
            if (window.parent) {
                window.parent.postMessage({ type: 'PAYMENT_FAILED' }, '*');
            }
        }
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('❌ Error en handleIzipayRefused:', error);
    res.status(500).send('Error procesando callback de rechazo');
  }
};
