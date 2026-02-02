const https = require('https');

function testEndpoint(path, data, description) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${description}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Path: ${path}`);
    console.log(`Data:`, JSON.stringify(data, null, 2));
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'yapeprobackend-production-up.railway.app',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`\n📊 Status: ${res.statusCode}`);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n📄 Response:`);
        try {
          const json = JSON.parse(body);
          console.log(JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          console.log(body || '(vacío)');
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`\n❌ Error: ${e.message}`);
      resolve({ error: e.message });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🔥 PRUEBAS DE SEGURIDAD EN PRODUCCIÓN');
  console.log('🌐 Backend: https://yapeprobackend-production-up.railway.app\n');

  // TEST 1: Intentar registrarse como super_admin
  const test1 = await testEndpoint(
    '/api/auth/register',
    {
      email: `hacker_test_${Date.now()}@test.com`,
      password: 'Hacker12345',
      full_name: 'Hacker Test User',
      phone: '+51999666333',
      role: 'super_admin'  // ⚠️ INTENTANDO ESCALAR PRIVILEGIOS
    },
    '🔴 Intentar auto-asignarse super_admin en registro'
  );

  if (test1.status === 201 && test1.body?.data?.user?.role === 'super_admin') {
    console.log('\n❌❌❌ ¡VULNERABILIDAD CRÍTICA!');
    console.log('❌ El usuario fue creado como super_admin');
  } else if (test1.status === 201 && test1.body?.data?.user?.role === 'owner') {
    console.log('\n✅✅✅ ¡SEGURO!');
    console.log('✅ El rol fue cambiado a "owner" (ignoró super_admin)');
  } else if (test1.status === 400 || test1.status === 409) {
    console.log('\n✅ El registro fue rechazado correctamente');
  }

  // TEST 2: Intentar usar endpoint público con secret key
  const test2 = await testEndpoint(
    '/api/auth/create-super-admin',
    {
      email: `admin_test_${Date.now()}@test.com`,
      password: 'Admin12345',
      full_name: 'Admin Test',
      secret_key: 'intentando_adivinar_la_clave'
    },
    '🔴 Endpoint público con secret key'
  );

  if (test2.status === 404) {
    console.log('\n✅✅✅ ¡EXCELENTE!');
    console.log('✅ Endpoint público DESHABILITADO en producción');
  } else if (test2.status === 403) {
    console.log('\n✅ Secret key rechazada');
  } else if (test2.status === 201) {
    console.log('\n❌❌❌ ¡PELIGRO!');
    console.log('❌ Endpoint público está activo');
  }

  // TEST 3: Intentar acceder al endpoint protegido sin JWT
  const test3 = await testEndpoint(
    '/api/admin/create-super-admin',
    {
      email: `admin2_test_${Date.now()}@test.com`,
      password: 'Admin12345',
      full_name: 'Admin Test 2'
    },
    '🔴 Endpoint protegido sin autenticación'
  );

  if (test3.status === 401 || test3.status === 403) {
    console.log('\n✅✅✅ ¡SEGURO!');
    console.log('✅ Requiere autenticación correctamente');
  } else if (test3.status === 201) {
    console.log('\n❌❌❌ ¡VULNERABILIDAD!');
    console.log('❌ Endpoint sin protección de autenticación');
  }

  // TEST 4: Verificar que la API está respondiendo correctamente
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: Verificar estado de la API`);
  console.log(`${'='.repeat(60)}`);
  
  https.get('https://yapeprobackend-production-up.railway.app/', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`\n📊 Status: ${res.statusCode}`);
      console.log(`📄 Response:`, body);
      
      console.log('\n\n' + '='.repeat(60));
      console.log('📊 RESUMEN FINAL');
      console.log('='.repeat(60));
      console.log('\n✅ Backend está activo y respondiendo');
      console.log('✅ Tests de seguridad completados');
      console.log('\nRevisa los resultados arriba para ver si hay vulnerabilidades.\n');
    });
  });
}

runTests().catch(console.error);
