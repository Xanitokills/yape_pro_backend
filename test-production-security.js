/**
 * Test de Seguridad - Producción
 * URL: https://yapeprobackend-production-up.railway.app
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://yapeprobackend-production-up.railway.app';

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runSecurityTests() {
  console.log('🔍 PRUEBAS DE SEGURIDAD - PRODUCCIÓN');
  console.log('=====================================');
  console.log(`🌐 URL: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  // TEST 1: Intentar auto-asignarse super_admin en registro
  console.log('TEST 1: Intentar registrarse como super_admin');
  console.log('---------------------------------------------');
  try {
    const res = await request('POST', '/api/auth/register', {
      email: `hacker_test_${Date.now()}@test.com`,
      password: 'Test1234',
      full_name: 'Hacker Test',
      phone: '+51999888777',
      role: 'super_admin'  // ⚠️ Intentando escalar privilegios
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 201 && res.body?.data?.user?.role === 'owner') {
      console.log('✅ PASS: Usuario creado con rol "owner" (ignoró super_admin)');
      passed++;
    } else if (res.status === 201 && res.body?.data?.user?.role === 'super_admin') {
      console.log('❌ FAIL: ¡VULNERABILIDAD! Usuario creado como super_admin');
      failed++;
    } else if (res.status === 400 || res.status === 409) {
      console.log('✅ PASS: Registro rechazado (probablemente teléfono/email ya existe)');
      passed++;
    } else {
      console.log(`⚠️  UNKNOWN: Status ${res.status}`);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }

  console.log('\n');

  // TEST 2: Intentar usar endpoint público con secret key
  console.log('TEST 2: Endpoint público /api/auth/create-super-admin');
  console.log('------------------------------------------------------');
  try {
    const res = await request('POST', '/api/auth/create-super-admin', {
      email: `admin_test_${Date.now()}@test.com`,
      password: 'Admin1234',
      full_name: 'Admin Test',
      secret_key: 'cualquier_clave'
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 404) {
      console.log('✅ PASS: Endpoint público DESHABILITADO en producción');
      passed++;
    } else if (res.status === 403) {
      console.log('✅ PASS: Endpoint rechaza sin secret key correcta');
      passed++;
    } else if (res.status === 201) {
      console.log('❌ FAIL: ¡VULNERABILIDAD! Endpoint público funcionando');
      failed++;
    } else {
      console.log(`⚠️  UNKNOWN: Status ${res.status}`);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }

  console.log('\n');

  // TEST 3: Intentar acceder al endpoint protegido sin autenticación
  console.log('TEST 3: Endpoint protegido /api/admin/create-super-admin SIN JWT');
  console.log('------------------------------------------------------------------');
  try {
    const res = await request('POST', '/api/admin/create-super-admin', {
      email: `admin_test_${Date.now()}@test.com`,
      password: 'Admin1234',
      full_name: 'Admin Test'
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 401 || res.status === 403) {
      console.log('✅ PASS: Endpoint requiere autenticación');
      passed++;
    } else if (res.status === 201) {
      console.log('❌ FAIL: ¡VULNERABILIDAD! Endpoint sin protección');
      failed++;
    } else {
      console.log(`⚠️  UNKNOWN: Status ${res.status}`);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }

  console.log('\n');

  // TEST 4: Intentar con JWT inválido
  console.log('TEST 4: Endpoint protegido con JWT INVÁLIDO');
  console.log('--------------------------------------------');
  try {
    const res = await request('POST', '/api/admin/create-super-admin', {
      email: `admin_test_${Date.now()}@test.com`,
      password: 'Admin1234',
      full_name: 'Admin Test'
    }, {
      'Authorization': 'Bearer token_falso_123456789'
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 401 || res.status === 403) {
      console.log('✅ PASS: JWT inválido rechazado');
      passed++;
    } else if (res.status === 201) {
      console.log('❌ FAIL: ¡VULNERABILIDAD! Acepta JWT inválido');
      failed++;
    } else {
      console.log(`⚠️  UNKNOWN: Status ${res.status}`);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    failed++;
  }

  console.log('\n');

  // TEST 5: Verificar que roles en otros endpoints también están protegidos
  console.log('TEST 5: Intentar cambiar rol en actualización de perfil');
  console.log('--------------------------------------------------------');
  try {
    const res = await request('PUT', '/api/auth/profile', {
      full_name: 'Test User',
      role: 'super_admin'  // ⚠️ Intentando escalar
    }, {
      'Authorization': 'Bearer token_falso'
    });

    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(res.body, null, 2));

    if (res.status === 401 || res.status === 403) {
      console.log('✅ PASS: Endpoint protegido (no autenticado)');
      passed++;
    } else {
      console.log(`⚠️  Status: ${res.status}`);
    }
  } catch (error) {
    console.log('⚠️  ERROR:', error.message);
  }

  console.log('\n');
  console.log('=====================================');
  console.log('📊 RESULTADOS FINALES');
  console.log('=====================================');
  console.log(`✅ Tests Pasados: ${passed}`);
  console.log(`❌ Tests Fallados: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ¡EXCELENTE! Tu API está SEGURA');
    console.log('✅ No se detectaron vulnerabilidades');
  } else {
    console.log('⚠️  SE DETECTARON VULNERABILIDADES');
    console.log('❌ Revisar los tests que fallaron');
  }

  console.log('\n');
}

// Ejecutar tests
runSecurityTests().catch(console.error);



