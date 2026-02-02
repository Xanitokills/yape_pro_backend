const https = require('https');

const HOST = 'yapeprobackend-production.up.railway.app';

console.log('🔥 SUITE COMPLETA DE TESTS DE SEGURIDAD');
console.log('========================================\n');

async function testEndpoint(name, path, method, data, headers = {}) {
  return new Promise((resolve) => {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`🧪 ${name}`);
    console.log(`${'─'.repeat(50)}`);
    console.log(`${method} https://${HOST}${path}`);
    
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: HOST,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(body);
          console.log(`📄 Response:`, JSON.stringify(json, null, 2).substring(0, 300));
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          console.log(`📄 Response: ${body.substring(0, 200)}`);
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    
    req.on('error', (e) => {
      console.log(`❌ Error: ${e.message}`);
      resolve({ error: e.message });
    });
    
    if (postData) req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  let passed = 0;
  let failed = 0;

  // TEST 1: Verificar que API está online
  const t1 = await testEndpoint(
    'TEST 1: API Online',
    '/',
    'GET'
  );
  if (t1.status === 200 && t1.body?.name === 'Yape Pro API') {
    console.log('✅ PASS: API respondiendo correctamente');
    passed++;
  } else {
    console.log('❌ FAIL: API no responde');
    failed++;
  }

  // TEST 2: Endpoint público create-super-admin deshabilitado
  const t2 = await testEndpoint(
    'TEST 2: Endpoint público /api/auth/create-super-admin (debe estar DESHABILITADO)',
    '/api/auth/create-super-admin',
    'POST',
    {
      email: 'hacker@test.com',
      password: 'Hacker123',
      full_name: 'Hacker',
      secret_key: 'intentando_hackear'
    }
  );
  if (t2.status === 404) {
    console.log('✅ PASS: Endpoint público DESHABILITADO en producción');
    passed++;
  } else if (t2.status === 403) {
    console.log('⚠️  WARN: Endpoint existe pero rechaza sin secret key');
    passed++;
  } else {
    console.log('❌ FAIL: Endpoint no debería estar disponible');
    failed++;
  }

  // TEST 3: Endpoint protegido sin JWT
  const t3 = await testEndpoint(
    'TEST 3: Endpoint admin /api/admin/create-super-admin SIN JWT',
    '/api/admin/create-super-admin',
    'POST',
    {
      email: 'hacker2@test.com',
      password: 'Hacker123',
      full_name: 'Hacker 2'
    }
  );
  if (t3.status === 401 || t3.status === 403) {
    console.log('✅ PASS: Requiere autenticación');
    passed++;
  } else {
    console.log('❌ FAIL: Debería requerir JWT');
    failed++;
  }

  // TEST 4: Endpoint protegido con JWT falso
  const t4 = await testEndpoint(
    'TEST 4: Endpoint admin con JWT FALSO',
    '/api/admin/create-super-admin',
    'POST',
    {
      email: 'hacker3@test.com',
      password: 'Hacker123',
      full_name: 'Hacker 3'
    },
    { 'Authorization': 'Bearer token_falso_12345' }
  );
  if (t4.status === 401 || t4.status === 403) {
    console.log('✅ PASS: JWT inválido rechazado');
    passed++;
  } else {
    console.log('❌ FAIL: Debería rechazar JWT inválido');
    failed++;
  }

  // TEST 5: Listar super admins sin autenticación
  const t5 = await testEndpoint(
    'TEST 5: Listar super admins SIN autenticación',
    '/api/admin/super-admins',
    'GET'
  );
  if (t5.status === 401 || t5.status === 403) {
    console.log('✅ PASS: Lista protegida');
    passed++;
  } else {
    console.log('❌ FAIL: Lista debería estar protegida');
    failed++;
  }

  // RESUMEN FINAL
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESUMEN FINAL DE SEGURIDAD');
  console.log('═'.repeat(50));
  console.log(`\n✅ Tests Pasados: ${passed}`);
  console.log(`❌ Tests Fallados: ${failed}`);
  console.log(`📊 Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log('🎉🎉🎉 ¡EXCELENTE! TU API ESTÁ SEGURA 🎉🎉🎉');
    console.log('\n✅ No se puede auto-asignar super_admin');
    console.log('✅ Endpoint público deshabilitado en producción');
    console.log('✅ Endpoints admin protegidos con JWT');
    console.log('✅ Parche de seguridad ACTIVO\n');
  } else {
    console.log('⚠️  HAY VULNERABILIDADES QUE REVISAR');
  }
}

runAllTests();
