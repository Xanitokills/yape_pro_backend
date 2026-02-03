// Test del Sistema de Parsing Dinámico
const dynamicParser = require('./src/services/parsers/dynamicParser');
const { supabase } = require('./src/config/database');

console.log('🧪 PRUEBAS DE PARSING DINÁMICO\n');
console.log('='.repeat(60));

async function runTests() {
  // 1. Verificar conexión y carga de patrones
  console.log('\n📡 Cargando patrones desde BD...');
  
  // Limpiar caché para test
  dynamicParser.refreshCache();
  
  const patterns = await dynamicParser.getActivePatterns('PE', 'yape');
  console.log(`   Patrones encontrados para PE/Yape: ${patterns.length}`);
  
  if (patterns.length === 0) {
    console.log('⚠️ No hay patrones en BD (asegúrate de correr la migración 003)');
    console.log('   Saliendo del test...');
    return;
  }
  
  // 2. Casos de prueba reales
  const testCases = [
    {
      desc: 'Yape Perú - Formato Yape!',
      text: 'Confirmación de Pago Yape! SANDRO SAAVEDRA te envió un pago por S/ 50.00',
      country: 'PE',
      expectedAmount: 50.00,
      expectedSender: 'SANDRO SAAVEDRA'
    },
    {
      desc: 'Yape Bolivia - QR',
      text: 'Recibiste un yapeo\nQR DE CHOQUE ORTIZ JUAN te envió Bs. 0.30',
      country: 'BO',
      expectedAmount: 0.30,
      expectedSender: 'CHOQUE ORTIZ JUAN'
    },
    {
      desc: 'Plin Te ha plineado',
      text: 'CARLOS RODRIGUEZ te ha plineado S/ 45.00',
      country: 'PE',
      expectedAmount: 45.00,
      expectedSender: 'CARLOS RODRIGUEZ'
    }
  ];
  
  console.log('\n🎯 Ejecutando casos de prueba:\n');
  
  for (const test of testCases) {
    console.log(`PRUEBA: ${test.desc}`);
    console.log(`Input: "${test.text}"`);
    
    const result = await dynamicParser.parse(test.text, test.country);
    
    if (result) {
      const amountOk = result.amount === test.expectedAmount;
      const senderOk = result.sender === test.expectedSender;
      
      if (amountOk && senderOk) {
        console.log('✅ PASS');
        console.log(`   Patrón ID: ${result.pattern_id}`);
      } else {
        console.log('❌ FAIL');
        if (!amountOk) console.log(`   Monto esperado: ${test.expectedAmount} vs Obtenido: ${result.amount}`);
        if (!senderOk) console.log(`   Sender esperado: "${test.expectedSender}" vs Obtenido: "${result.sender}"`);
      }
    } else {
      console.log('❌ FAIL: No se detectó patrón');
    }
    console.log('-'.repeat(40));
  }
  
  console.log('\n🏁 Tests finalizados');
}

runTests().catch(console.error);
