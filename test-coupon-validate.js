// test-coupon-validate.js - Script para probar validación de cupones
const axios = require('axios');

const BASE_URL = 'https://yapeprobackend-production.up.railway.app';

async function testCouponValidation() {
  console.log('🧪 Iniciando pruebas de validación de cupones\n');
  console.log('=' .repeat(60));

  // Test 1: Validar cupón solo con código
  console.log('\n📋 Test 1: Validar cupón TRANS50 (solo código)');
  console.log('-'.repeat(60));
  try {
    const response1 = await axios.post(
      `${BASE_URL}/api/coupons/validate`,
      { code: 'TRANS50' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Status:', response1.status);
    console.log('📦 Response:', JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('📦 Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 2: Validar cupón inexistente
  console.log('\n📋 Test 2: Validar cupón inexistente');
  console.log('-'.repeat(60));
  try {
    const response2 = await axios.post(
      `${BASE_URL}/api/coupons/validate`,
      { code: 'NOEXISTE' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Status:', response2.status);
    console.log('📦 Response:', JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('📦 Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 3: Validar sin código
  console.log('\n📋 Test 3: Validar sin código (debe fallar)');
  console.log('-'.repeat(60));
  try {
    const response3 = await axios.post(
      `${BASE_URL}/api/coupons/validate`,
      {},
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Status:', response3.status);
    console.log('📦 Response:', JSON.stringify(response3.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('📦 Response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 4: Validar con storeId y amount opcionales
  console.log('\n📋 Test 4: Validar TRANS50 con storeId y amount');
  console.log('-'.repeat(60));
  try {
    const response4 = await axios.post(
      `${BASE_URL}/api/coupons/validate`,
      { 
        code: 'TRANS50',
        storeId: '7ab06377-80d1-4571-b563-e4939613545c',
        amount: 100
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ Status:', response4.status);
    console.log('📦 Response:', JSON.stringify(response4.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('📦 Response:', JSON.stringify(error.response?.data, null, 2));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Pruebas completadas\n');
}

// Ejecutar las pruebas
testCouponValidation().catch(console.error);
