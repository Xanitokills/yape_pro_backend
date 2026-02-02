/**
 * Test simple - Verificar conectividad
 */

const https = require('https');

async function testURL(url) {
  return new Promise((resolve) => {
    console.log(`\nProbando: ${url}`);
    
    https.get(url, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Headers:`, Object.keys(res.headers).join(', '));
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (body.length > 0) {
          console.log(`  Body length: ${body.length} bytes`);
          console.log(`  Preview:`, body.substring(0, 200));
        }
        resolve({ status: res.statusCode, body });
      });
    }).on('error', (e) => {
      console.log(`  ❌ Error: ${e.message}`);
      resolve({ error: e.message });
    });
  });
}

async function main() {
  console.log('🔍 VERIFICACIÓN DE CONECTIVIDAD\n');
  console.log('================================\n');

  // Probar diferentes variaciones
  const urls = [
    'https://pagoseguro.dev',
    'https://pagoseguro.dev/api',
    'https://pagoseguro.dev/api/auth',
    'https://www.pagoseguro.dev',
    'https://api.pagoseguro.dev',
  ];

  for (const url of urls) {
    await testURL(url);
  }

  console.log('\n================================');
  console.log('Por favor indica cuál es la URL correcta de tu backend');
}

main();
