const https = require('https');

const testData = JSON.stringify({
  email: `hacker_final_test_${Date.now()}@example.com`,
  password: 'HackerTest123!',
  full_name: 'Hacker Final Test',
  phone: '+51999111222',
  role: 'super_admin'  // ⚠️ INTENTANDO HACKEAR
});

const options = {
  hostname: 'yapeprobackend-production-up.railway.app',
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🔥 TEST FINAL DE SEGURIDAD');
console.log('==========================\n');
console.log('🌐 URL:', `https://${options.hostname}${options.path}`);
console.log('📤 Enviando:', JSON.parse(testData));
console.log('\n⚠️  INTENTANDO AUTO-ASIGNARSE COMO SUPER_ADMIN...\n');

const req = https.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}\n`);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('📄 Respuesta del servidor:');
      console.log(JSON.stringify(response, null, 2));
      
      // Análisis de seguridad
      console.log('\n' + '='.repeat(50));
      console.log('🔍 ANÁLISIS DE SEGURIDAD');
      console.log('='.repeat(50));
      
      if (res.statusCode === 201) {
        const userRole = response.data?.user?.role;
        console.log(`\n✅ Usuario creado exitosamente`);
        console.log(`📝 Rol asignado: "${userRole}"`);
        
        if (userRole === 'super_admin') {
          console.log('\n❌❌❌ ¡VULNERABILIDAD CRÍTICA DETECTADA!');
          console.log('❌ El usuario fue creado con rol "super_admin"');
          console.log('❌ La escalación de privilegios es POSIBLE');
          console.log('\n🚨 ACCIÓN REQUERIDA: Desplegar el parche de seguridad');
        } else if (userRole === 'owner') {
          console.log('\n✅✅✅ ¡SEGURIDAD CORRECTA!');
          console.log('✅ El sistema ignoró el parámetro "role"');
          console.log('✅ Usuario forzado a rol "owner"');
          console.log('✅ Parche de seguridad ACTIVO');
        }
      } else if (res.statusCode === 400) {
        console.log('\n✅ Registro rechazado por validación');
        console.log('Razón:', response.message || response.error);
      } else if (res.statusCode === 409) {
        console.log('\n✅ Conflicto (email/teléfono ya existe)');
      } else if (res.statusCode === 404) {
        console.log('\n⚠️  Endpoint no encontrado');
        console.log('⚠️  Posibles causas:');
        console.log('   - Backend no desplegado correctamente');
        console.log('   - Ruta incorrecta');
        console.log('   - Railway en versión antigua');
      }
      
      console.log('\n');
      
    } catch (e) {
      console.log('📄 Respuesta (no JSON):', body);
      console.log('\n⚠️  Error parseando respuesta:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Error de conexión: ${e.message}`);
});

req.write(testData);
req.end();
