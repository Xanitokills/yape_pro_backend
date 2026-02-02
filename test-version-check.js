const https = require('https');

console.log('🔍 COMPARACIÓN: Código LOCAL vs Railway REMOTO\n');
console.log('='.repeat(60));

// Test 1: Endpoint raíz
console.log('\n1️⃣  ENDPOINT: GET /');
console.log('-'.repeat(60));

console.log('\n📝 ESPERADO (según código local):');
console.log(JSON.stringify({
  name: 'Yape Pro API',
  version: '1.0.0',
  status: 'online',
  documentation: 'Contacta al administrador para más información'
}, null, 2));

https.get('https://yapeprobackend-production-up.railway.app/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('\n📡 RECIBIDO (desde Railway):');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
      console.log('\n✅ COINCIDE - Railway tiene código NUEVO');
    } catch (e) {
      console.log(body.substring(0, 200));
      console.log('\n❌ NO COINCIDE - Railway tiene código VIEJO');
      console.log('   (Devuelve texto plano en vez de JSON)');
    }
    
    // Test 2: Endpoint /health
    console.log('\n' + '='.repeat(60));
    console.log('\n2️⃣  ENDPOINT: GET /health');
    console.log('-'.repeat(60));
    
    console.log('\n📝 ESPERADO (según código local):');
    console.log(JSON.stringify({
      status: 'OK',
      timestamp: '2026-01-31T...',
      uptime: 12345.67
    }, null, 2));
    
    https.get('https://yapeprobackend-production-up.railway.app/health', (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('\n📡 RECIBIDO (desde Railway):');
        try {
          const json = JSON.parse(body2);
          console.log(JSON.stringify(json, null, 2));
          console.log('\n✅ COINCIDE - Railway tiene código NUEVO');
        } catch (e) {
          console.log(`"${body2}"`);
          console.log('\n❌ NO COINCIDE - Railway tiene código VIEJO');
          console.log('   (Devuelve "OK" en vez de JSON con timestamp)');
        }
        
        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 CONCLUSIÓN:');
        console.log('='.repeat(60));
        
        const rootIsOld = body.includes('Railway');
        const healthIsOld = body2 === 'OK';
        
        if (rootIsOld || healthIsOld) {
          console.log('\n❌ Railway está corriendo CÓDIGO ANTIGUO');
          console.log('\n   Evidencia:');
          if (rootIsOld) console.log('   • GET / devuelve ASCII art en vez de JSON');
          if (healthIsOld) console.log('   • GET /health devuelve "OK" en vez de JSON');
          console.log('\n   🔧 Solución:');
          console.log('   1. Ve a Railway Dashboard');
          console.log('   2. Verifica que el deployment se completó');
          console.log('   3. Revisa los logs por errores');
          console.log('   4. Fuerza un redeploy manual si es necesario');
        } else {
          console.log('\n✅ Railway está corriendo CÓDIGO NUEVO');
          console.log('\n   Ahora podemos probar la seguridad:');
          console.log('   node test-final.js');
        }
        console.log('\n');
      });
    });
  });
});
