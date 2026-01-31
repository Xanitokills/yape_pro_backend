/**
 * TEST DE SEGURIDAD - Sistema de Super Admins
 * Ejecutar: node test-security.js
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3002/api';

// Configuración de prueba
const TEST_CONFIG = {
  existingSuperAdmin: {
    email: 'saavedracastrosandro@gmail.com',
    password: 'Sandro1509', // Cambiar por tu contraseña real
  },
  testUser: {
    email: `test_${Date.now()}@test.com`,
    password: 'Test1234567!',
    full_name: 'Usuario de Prueba',
    phone: '+51999888777'
  },
  newSuperAdmin: {
    email: `admin_${Date.now()}@test.com`,
    password: 'Admin1234567!',
    full_name: 'Admin de Prueba'
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper para mostrar resultados
function logTest(name, passed, message, details = null) {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS'.green : 'FAIL'.red;
  console.log(`\n${icon} [${status}] ${name}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   Detalles:`.gray, JSON.stringify(details, null, 2).gray);
  }
  
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Esperar un poco entre requests
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('═'.repeat(60).cyan);
  console.log('🔐 TEST DE SEGURIDAD - SUPER ADMINS'.cyan.bold);
  console.log('═'.repeat(60).cyan);
  console.log('Base URL:'.gray, BASE_URL);
  console.log('Fecha:'.gray, new Date().toLocaleString());
  console.log('═'.repeat(60).cyan);

  try {
    // ========================================
    // TEST 1: Intentar auto-asignarse super_admin en registro
    // ========================================
    console.log('\n\n📋 TEST 1: Intentar auto-asignarse super_admin'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password,
        full_name: TEST_CONFIG.testUser.full_name,
        phone: TEST_CONFIG.testUser.phone,
        role: 'super_admin' // ⚠️ Intentando hackear
      });
      
      const userRole = response.data.data.user.role;
      
      if (userRole === 'owner') {
        logTest(
          'TEST 1: Prevención de auto-asignación',
          true,
          'El sistema ignoró el rol "super_admin" y asignó "owner" correctamente',
          { sentRole: 'super_admin', receivedRole: userRole }
        );
      } else {
        logTest(
          'TEST 1: Prevención de auto-asignación',
          false,
          `El usuario se registró con rol: ${userRole} (debería ser "owner")`,
          { sentRole: 'super_admin', receivedRole: userRole }
        );
      }
    } catch (error) {
      logTest(
        'TEST 1: Prevención de auto-asignación',
        false,
        'Error al intentar registro',
        { error: error.message }
      );
    }

    await wait(1000);

    // ========================================
    // TEST 2: Login con super_admin existente
    // ========================================
    console.log('\n\n📋 TEST 2: Login con super_admin existente'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    let superAdminToken = null;
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_CONFIG.existingSuperAdmin.email,
        password: TEST_CONFIG.existingSuperAdmin.password
      });
      
      superAdminToken = response.data.data.token;
      const userRole = response.data.data.user.role;
      
      if (superAdminToken && userRole === 'super_admin') {
        logTest(
          'TEST 2: Login super_admin',
          true,
          'Login exitoso, token JWT obtenido',
          { role: userRole, tokenLength: superAdminToken.length }
        );
      } else {
        logTest(
          'TEST 2: Login super_admin',
          false,
          'Login exitoso pero rol incorrecto o sin token',
          { role: userRole, hasToken: !!superAdminToken }
        );
      }
    } catch (error) {
      logTest(
        'TEST 2: Login super_admin',
        false,
        'Error al intentar login',
        { error: error.response?.data || error.message }
      );
    }

    await wait(1000);

    // ========================================
    // TEST 3: Intentar crear super_admin SIN token (debe fallar)
    // ========================================
    console.log('\n\n📋 TEST 3: Crear super_admin SIN autenticación'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    try {
      const response = await axios.post(`${BASE_URL}/admin/create-super-admin`, {
        email: `hacker_${Date.now()}@hack.com`,
        password: 'Hacker123!',
        full_name: 'Hacker Malicioso'
      });
      
      logTest(
        'TEST 3: Protección sin token',
        false,
        '❌ CRÍTICO: Se permitió crear super_admin sin autenticación',
        { response: response.data }
      );
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logTest(
          'TEST 3: Protección sin token',
          true,
          'Correctamente bloqueado (401/403)',
          { status: error.response.status, message: error.response.data.message }
        );
      } else {
        logTest(
          'TEST 3: Protección sin token',
          false,
          'Error inesperado',
          { error: error.message }
        );
      }
    }

    await wait(1000);

    // ========================================
    // TEST 4: Crear super_admin CON token válido (debe funcionar)
    // ========================================
    console.log('\n\n📋 TEST 4: Crear super_admin CON token válido'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    if (superAdminToken) {
      try {
        const response = await axios.post(
          `${BASE_URL}/admin/create-super-admin`,
          {
            email: TEST_CONFIG.newSuperAdmin.email,
            password: TEST_CONFIG.newSuperAdmin.password,
            full_name: TEST_CONFIG.newSuperAdmin.full_name
          },
          {
            headers: {
              'Authorization': `Bearer ${superAdminToken}`
            }
          }
        );
        
        const newAdminRole = response.data.data.user.role;
        
        if (response.status === 201 && newAdminRole === 'super_admin') {
          logTest(
            'TEST 4: Creación con token válido',
            true,
            'Super admin creado exitosamente',
            { 
              email: response.data.data.user.email,
              role: newAdminRole,
              id: response.data.data.user.id
            }
          );
        } else {
          logTest(
            'TEST 4: Creación con token válido',
            false,
            'Respuesta inesperada',
            { response: response.data }
          );
        }
      } catch (error) {
        logTest(
          'TEST 4: Creación con token válido',
          false,
          'Error al crear super admin',
          { error: error.response?.data || error.message }
        );
      }
    } else {
      logTest(
        'TEST 4: Creación con token válido',
        false,
        'No se pudo ejecutar (no hay token del TEST 2)',
        null
      );
    }

    await wait(1000);

    // ========================================
    // TEST 5: Listar super_admins
    // ========================================
    console.log('\n\n📋 TEST 5: Listar super_admins'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    if (superAdminToken) {
      try {
        const response = await axios.get(`${BASE_URL}/admin/super-admins`, {
          headers: {
            'Authorization': `Bearer ${superAdminToken}`
          }
        });
        
        const admins = response.data.data.superAdmins;
        
        logTest(
          'TEST 5: Listar super_admins',
          true,
          `Se encontraron ${admins.length} super administradores`,
          { count: admins.length, emails: admins.map(a => a.email) }
        );
      } catch (error) {
        logTest(
          'TEST 5: Listar super_admins',
          false,
          'Error al listar',
          { error: error.response?.data || error.message }
        );
      }
    } else {
      logTest(
        'TEST 5: Listar super_admins',
        false,
        'No se pudo ejecutar (no hay token)',
        null
      );
    }

    await wait(1000);

    // ========================================
    // TEST 6: Intentar crear super_admin con token de owner (debe fallar)
    // ========================================
    console.log('\n\n📋 TEST 6: Intentar crear super_admin con token de OWNER'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    try {
      // Login con usuario owner (el que creamos en TEST 1)
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      });
      
      const ownerToken = loginResponse.data.data.token;
      
      // Intentar crear super_admin con token de owner
      try {
        const response = await axios.post(
          `${BASE_URL}/admin/create-super-admin`,
          {
            email: `hacker2_${Date.now()}@hack.com`,
            password: 'Hacker123!',
            full_name: 'Hacker con Owner Token'
          },
          {
            headers: {
              'Authorization': `Bearer ${ownerToken}`
            }
          }
        );
        
        logTest(
          'TEST 6: Protección por rol',
          false,
          '❌ CRÍTICO: Owner pudo crear super_admin',
          { response: response.data }
        );
      } catch (error) {
        if (error.response?.status === 403) {
          logTest(
            'TEST 6: Protección por rol',
            true,
            'Correctamente bloqueado (403 Forbidden)',
            { status: error.response.status, message: error.response.data.message }
          );
        } else {
          logTest(
            'TEST 6: Protección por rol',
            false,
            'Error inesperado',
            { error: error.message }
          );
        }
      }
    } catch (error) {
      logTest(
        'TEST 6: Protección por rol',
        false,
        'Error en el test',
        { error: error.message }
      );
    }

    await wait(1000);

    // ========================================
    // TEST 7: Endpoint público con secret key (solo en desarrollo)
    // ========================================
    console.log('\n\n📋 TEST 7: Endpoint público con secret key'.yellow.bold);
    console.log('─'.repeat(60).gray);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/create-super-admin`, {
        email: `public_test_${Date.now()}@test.com`,
        password: 'Test123456!',
        full_name: 'Test Endpoint Público',
        secret_key: process.env.SUPER_ADMIN_SECRET_KEY
      });
      
      if (process.env.NODE_ENV === 'production') {
        logTest(
          'TEST 7: Endpoint público',
          false,
          '❌ CRÍTICO: Endpoint público activo en producción',
          { response: response.data }
        );
      } else {
        logTest(
          'TEST 7: Endpoint público',
          true,
          'Endpoint disponible en desarrollo (OK para testing)',
          { env: process.env.NODE_ENV }
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        logTest(
          'TEST 7: Endpoint público',
          true,
          'Endpoint deshabilitado correctamente (404)',
          { status: error.response.status }
        );
      } else if (error.response?.status === 403) {
        logTest(
          'TEST 7: Endpoint público',
          true,
          'Protegido con secret key (403)',
          { status: error.response.status }
        );
      } else {
        logTest(
          'TEST 7: Endpoint público',
          false,
          'Error inesperado',
          { error: error.message }
        );
      }
    }

  } catch (error) {
    console.error('\n❌ Error fatal en tests:'.red.bold, error.message);
  }

  // ========================================
  // RESUMEN FINAL
  // ========================================
  console.log('\n\n' + '═'.repeat(60).cyan);
  console.log('📊 RESUMEN DE TESTS'.cyan.bold);
  console.log('═'.repeat(60).cyan);
  
  console.log(`\n✅ Tests exitosos: ${testResults.passed}`.green);
  console.log(`❌ Tests fallidos: ${testResults.failed}`.red);
  console.log(`📝 Total tests: ${testResults.tests.length}`.gray);
  
  const percentage = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\n🎯 Éxito: ${percentage}%`.yellow.bold);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Sistema seguro ✅'.green.bold);
  } else {
    console.log('\n⚠️  ATENCIÓN: Algunos tests fallaron. Revisar arriba.'.red.bold);
  }
  
  console.log('\n' + '═'.repeat(60).cyan);
  
  // Detalles de tests fallidos
  if (testResults.failed > 0) {
    console.log('\n❌ TESTS FALLIDOS:'.red.bold);
    testResults.tests.filter(t => !t.passed).forEach((test, i) => {
      console.log(`\n${i + 1}. ${test.name}`.red);
      console.log(`   ${test.message}`.gray);
    });
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Ejecutar tests
console.log('\n⏳ Iniciando tests en 2 segundos...'.yellow);
console.log('⚠️  Asegúrate de que el backend esté corriendo en', BASE_URL.cyan);
console.log('⚠️  Cambia la contraseña en TEST_CONFIG si es necesario\n'.yellow);

setTimeout(() => {
  runTests().catch(error => {
    console.error('\n💥 Error fatal:'.red.bold, error);
    process.exit(1);
  });
}, 2000);
