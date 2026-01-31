/**
 * TEST DE SEGURIDAD SIMPLE - Sistema de Super Admins
 * Ejecutar: node test-security-simple.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Configuración - CAMBIAR CON TUS DATOS
const SUPER_ADMIN_EMAIL = 'saavedracastrosandro@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Sandro1509'; // CAMBIAR

let testsPassed = 0;
let testsFailed = 0;

async function test1_AutoAsignacionSuperAdmin() {
  console.log('\n========================================');
  console.log('TEST 1: Intentar auto-asignarse super_admin');
  console.log('========================================');
  
  const testEmail = `test_${Date.now()}@test.com`;
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'Test1234567!',
      full_name: 'Usuario de Prueba',
      phone: '+51999888777',
      role: 'super_admin' // Intentando hackear
    });
    
    const receivedRole = response.data.data.user.role;
    console.log('Rol enviado:', 'super_admin');
    console.log('Rol recibido:', receivedRole);
    
    if (receivedRole === 'owner') {
      console.log('✅ PASS: Sistema ignoró el rol y asignó "owner"');
      testsPassed++;
      return { email: testEmail, password: 'Test1234567!' };
    } else {
      console.log('❌ FAIL: Usuario tiene rol:', receivedRole);
      testsFailed++;
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.response?.data?.message || error.message);
    testsFailed++;
    return null;
  }
}

async function test2_LoginSuperAdmin() {
  console.log('\n========================================');
  console.log('TEST 2: Login con super_admin existente');
  console.log('========================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD
    });
    
    const token = response.data.data.token;
    const role = response.data.data.user.role;
    
    console.log('Email:', SUPER_ADMIN_EMAIL);
    console.log('Rol:', role);
    console.log('Token obtenido:', token ? 'SÍ' : 'NO');
    
    if (token && role === 'super_admin') {
      console.log('✅ PASS: Login exitoso');
      testsPassed++;
      return token;
    } else {
      console.log('❌ FAIL: Token o rol inválido');
      testsFailed++;
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.response?.data?.message || error.message);
    testsFailed++;
    return null;
  }
}

async function test3_CrearSuperAdminSinToken() {
  console.log('\n========================================');
  console.log('TEST 3: Crear super_admin SIN token (debe fallar)');
  console.log('========================================');
  
  try {
    await axios.post(`${BASE_URL}/admin/create-super-admin`, {
      email: `hacker_${Date.now()}@hack.com`,
      password: 'Hacker123!',
      full_name: 'Hacker Malicioso'
    });
    
    console.log('❌ FAIL: ¡Se permitió crear super_admin sin token!');
    testsFailed++;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.log(`✅ PASS: Bloqueado correctamente (${status})`);
      testsPassed++;
    } else {
      console.log('❌ FAIL: Error inesperado:', error.message);
      testsFailed++;
    }
  }
}

async function test4_CrearSuperAdminConToken(token) {
  console.log('\n========================================');
  console.log('TEST 4: Crear super_admin CON token válido');
  console.log('========================================');
  
  if (!token) {
    console.log('⚠️  SKIP: No hay token del TEST 2');
    return null;
  }
  
  const newAdminEmail = `admin_${Date.now()}@test.com`;
  
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/create-super-admin`,
      {
        email: newAdminEmail,
        password: 'Admin1234567!',
        full_name: 'Admin de Prueba'
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const role = response.data.data.user.role;
    const email = response.data.data.user.email;
    
    console.log('Email creado:', email);
    console.log('Rol:', role);
    
    if (response.status === 201 && role === 'super_admin') {
      console.log('✅ PASS: Super admin creado exitosamente');
      testsPassed++;
      return email;
    } else {
      console.log('❌ FAIL: Respuesta inesperada');
      testsFailed++;
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.response?.data?.message || error.message);
    testsFailed++;
    return null;
  }
}

async function test5_ListarSuperAdmins(token) {
  console.log('\n========================================');
  console.log('TEST 5: Listar super_admins');
  console.log('========================================');
  
  if (!token) {
    console.log('⚠️  SKIP: No hay token');
    return;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/super-admins`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const admins = response.data.data.superAdmins;
    
    console.log(`Total super_admins encontrados: ${admins.length}`);
    console.log('\nLista:');
    admins.forEach((admin, i) => {
      console.log(`  ${i + 1}. ${admin.email} (creado: ${new Date(admin.created_at).toLocaleDateString()})`);
    });
    
    console.log('\n✅ PASS: Listado exitoso');
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL:', error.response?.data?.message || error.message);
    testsFailed++;
  }
}

async function test6_OwnerIntentaCrearSuperAdmin(ownerCredentials) {
  console.log('\n========================================');
  console.log('TEST 6: Owner intenta crear super_admin (debe fallar)');
  console.log('========================================');
  
  if (!ownerCredentials) {
    console.log('⚠️  SKIP: No hay credenciales de owner del TEST 1');
    return;
  }
  
  try {
    // Login como owner
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ownerCredentials.email,
      password: ownerCredentials.password
    });
    
    const ownerToken = loginResponse.data.data.token;
    console.log('Login como owner:', ownerCredentials.email);
    
    // Intentar crear super_admin
    try {
      await axios.post(
        `${BASE_URL}/admin/create-super-admin`,
        {
          email: `hacker2_${Date.now()}@hack.com`,
          password: 'Hacker123!',
          full_name: 'Hacker con Owner Token'
        },
        {
          headers: { 'Authorization': `Bearer ${ownerToken}` }
        }
      );
      
      console.log('❌ FAIL: ¡Owner pudo crear super_admin!');
      testsFailed++;
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ PASS: Bloqueado correctamente (403 Forbidden)');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Error inesperado:', error.message);
        testsFailed++;
      }
    }
  } catch (error) {
    console.log('❌ FAIL en login:', error.message);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('🔐 TEST DE SEGURIDAD - SUPER ADMINS');
  console.log('='.repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('Super Admin:', SUPER_ADMIN_EMAIL);
  console.log('Fecha:', new Date().toLocaleString());
  console.log('='.repeat(60));
  
  console.log('\n⏳ Iniciando tests...\n');
  
  try {
    // Ejecutar tests en orden
    const ownerCredentials = await test1_AutoAsignacionSuperAdmin();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const superAdminToken = await test2_LoginSuperAdmin();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await test3_CrearSuperAdminSinToken();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await test4_CrearSuperAdminConToken(superAdminToken);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await test5_ListarSuperAdmins(superAdminToken);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await test6_OwnerIntentaCrearSuperAdmin(ownerCredentials);
    
  } catch (error) {
    console.log('\n❌ Error fatal:', error.message);
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests exitosos: ${testsPassed}`);
  console.log(`❌ Tests fallidos: ${testsFailed}`);
  console.log(`📝 Total: ${testsPassed + testsFailed}`);
  
  const percentage = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
  console.log(`🎯 Éxito: ${percentage}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Sistema seguro ✅');
  } else {
    console.log('\n⚠️  ATENCIÓN: Algunos tests fallaron');
  }
  
  console.log('='.repeat(60) + '\n');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Ejecutar
console.log('\n⚠️  CONFIGURACIÓN:');
console.log('    Verifica que el backend esté corriendo:', BASE_URL);
console.log('    Super Admin:', SUPER_ADMIN_EMAIL);
console.log('    ⚠️  Cambia SUPER_ADMIN_PASSWORD en el código si es necesario');
console.log('\n⏳ Iniciando en 3 segundos...\n');

setTimeout(() => {
  runAllTests().catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
}, 3000);
