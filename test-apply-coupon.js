// test-apply-coupon.js - Test para aplicar cupón TRANS50
const axios = require('axios');

const BASE_URL = 'https://yapeprobackend-production.up.railway.app';

async function testApplyCoupon() {
  console.log('🧪 Probando aplicación de cupón TRANS50\n');
  console.log('=' .repeat(60));

  // Test 1: Aplicar cupón de transacciones sin amount (debería funcionar)
  console.log('\n📋 Test 1: Aplicar TRANS50 sin amount (cupón de transacciones)');
  console.log('-'.repeat(60));
  try {
    const response = await axios.post(
      `${BASE_URL}/api/coupons/apply`,
      { 
        code: 'TRANS50',
        storeId: '7ab06377-80d1-4571-b563-e4939613545c'
      },
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('📦 Response:', JSON.stringify(error.response?.data, null, 2));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completado\n');
}

// Ejecutar test
testApplyCoupon().catch(console.error);
