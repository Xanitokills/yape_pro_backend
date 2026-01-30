// Test de notificaciones de Yape Bolivia
const notificationParser = require('./src/services/notificationParser');

console.log('🇧🇴 PRUEBAS DE NOTIFICACIONES YAPE BOLIVIA\n');
console.log('='.repeat(60));

const testCases = [
  {
    name: 'Bolivia - Formato QR',
    text: 'Recibiste un yapeo\nQR DE CHOQUE ORTIZ JUAN GABRIEL te envió Bs. 0.30',
    shouldProcess: true,
    expectedAmount: 0.30,
    expectedSender: 'CHOQUE ORTIZ JUAN GABRIEL'
  },
  {
    name: 'Bolivia - Formato corto',
    text: 'MARIA LOPEZ PEREZ te envió Bs. 15.50',
    shouldProcess: true,
    expectedAmount: 15.50,
    expectedSender: 'MARIA LOPEZ PEREZ'
  },
  {
    name: 'Bolivia - Con "yapeo"',
    text: 'yapeo CARLOS MENDOZA te envió Bs. 100.00',
    shouldProcess: true,
    expectedAmount: 100.00,
    expectedSender: 'CARLOS MENDOZA'
  },
  {
    name: 'Perú - Formato estándar (debe seguir funcionando)',
    text: 'Yape! JUAN PEREZ te envió un pago por S/ 50.00',
    shouldProcess: true,
    expectedAmount: 50.00,
    expectedSender: 'JUAN PEREZ'
  },
  {
    name: 'Perú - Formato antiguo (debe seguir funcionando)',
    text: 'Recibiste S/ 25.00 de MARIA GARCIA via Yape',
    shouldProcess: true,
    expectedAmount: 25.00,
    expectedSender: 'MARIA GARCIA'
  },
  {
    name: 'Bolivia - Pago saliente (NO debe procesarse)',
    text: 'Enviaste Bs. 20.00 a Juan Pérez',
    shouldProcess: false
  },
  {
    name: 'Bolivia - Spam (NO debe procesarse)',
    text: 'Aprovecha descuentos en Bolivia - Yape',
    shouldProcess: false
  }
];

console.log('\n📋 EJECUTANDO CASOS DE PRUEBA...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log('─'.repeat(60));
  console.log(`Texto: "${testCase.text}"`);
  
  const result = notificationParser.parse(testCase.text);
  
  if (testCase.shouldProcess) {
    if (!result) {
      console.log('❌ FALLÓ - Se esperaba un resultado pero se obtuvo null');
      failed++;
    } else {
      // Verificar monto
      const amountMatch = Math.abs(result.amount - testCase.expectedAmount) < 0.01;
      const senderMatch = result.sender.toUpperCase().includes(testCase.expectedSender.toUpperCase()) ||
                         testCase.expectedSender.toUpperCase().includes(result.sender.toUpperCase());
      
      if (amountMatch && senderMatch) {
        console.log('✅ PASÓ');
        console.log(`   Monto: ${result.amount} (esperado: ${testCase.expectedAmount})`);
        console.log(`   Remitente: ${result.sender} (esperado: ${testCase.expectedSender})`);
        console.log(`   Fuente: ${result.source}`);
        passed++;
      } else {
        console.log('❌ FALLÓ - Los datos no coinciden');
        console.log(`   Monto obtenido: ${result.amount} (esperado: ${testCase.expectedAmount})`);
        console.log(`   Remitente obtenido: ${result.sender} (esperado: ${testCase.expectedSender})`);
        failed++;
      }
    }
  } else {
    if (result === null) {
      console.log('✅ PASÓ - Correctamente rechazado');
      passed++;
    } else {
      console.log('❌ FALLÓ - Se esperaba null pero se procesó la notificación');
      console.log(`   Resultado: monto=${result.amount}, remitente=${result.sender}`);
      failed++;
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN DE PRUEBAS:');
console.log(`   ✅ Pasaron: ${passed}/${testCases.length}`);
console.log(`   ❌ Fallaron: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!\n');
} else {
  console.log('\n⚠️  Algunas pruebas fallaron. Revisa los detalles arriba.\n');
  process.exit(1);
}
