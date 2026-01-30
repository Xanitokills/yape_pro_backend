// Test de filtrado de ofertas/promociones de Yape Perú
const notificationParser = require('./src/services/notificationParser');

console.log('🛍️ PRUEBAS DE FILTRADO DE OFERTAS/PROMOCIONES\n');
console.log('='.repeat(60));

const testCases = [
  // ❌ OFERTAS DE PRODUCTOS (NO deben procesarse)
  {
    name: 'Oferta de restaurante',
    text: 'Papa Johns - Pizza grande a S/ 25.90. ¡Pide ahora con Yape!',
    shouldProcess: false
  },
  {
    name: 'Oferta de tienda',
    text: 'Shopstar tiene productos desde S/ 10.00. Aprovecha con Yape',
    shouldProcess: false
  },
  {
    name: 'Promoción con precio',
    text: 'Compra ahora en Saga Falabella. Descuentos hasta S/ 500. Paga con Yape',
    shouldProcess: false
  },
  {
    name: 'Oferta de comida',
    text: 'Bembos - Combo a S/ 18.90. Yape y recibe tu pedido',
    shouldProcess: false
  },
  {
    name: 'Publicidad de producto',
    text: 'Nuevo iPhone desde S/ 3000. Compra con Yape y gana puntos',
    shouldProcess: false
  },
  {
    name: 'Invitación a comprar',
    text: 'Te invitamos a conocer nuestros productos desde S/ 50',
    shouldProcess: false
  },
  {
    name: 'Oferta con "desde" o "hasta"',
    text: 'Productos desde S/ 5.00 hasta S/ 100',
    shouldProcess: false
  },
  {
    name: 'Publicidad con marca',
    text: 'Adidas tiene zapatillas desde S/ 120. Paga con Yape',
    shouldProcess: false
  },
  // ✅ PAGOS REALES (SÍ deben procesarse)
  {
    name: 'Pago real - formato estándar',
    text: 'Yape! JUAN PEREZ te envió un pago por S/ 50.00',
    shouldProcess: true,
    expectedAmount: 50.00,
    expectedSender: 'JUAN PEREZ'
  },
  {
    name: 'Pago real - formato antiguo',
    text: 'Recibiste S/ 25.50 de Maria Lopez via Yape',
    shouldProcess: true,
    expectedAmount: 25.50
  },
  {
    name: 'Pago real - Plin',
    text: 'Carlos Mendoza te ha plineado S/ 100.00',
    shouldProcess: true,
    expectedAmount: 100.00
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
    // Debe ser procesado como pago
    if (!result) {
      console.log('❌ FALLÓ - Se esperaba un pago válido pero se rechazó');
      failed++;
    } else {
      if (testCase.expectedAmount) {
        const amountMatch = Math.abs(result.amount - testCase.expectedAmount) < 0.01;
        if (amountMatch) {
          console.log('✅ PASÓ - Pago detectado correctamente');
          console.log(`   Monto: S/ ${result.amount}`);
          console.log(`   Remitente: ${result.sender}`);
          passed++;
        } else {
          console.log('❌ FALLÓ - Monto incorrecto');
          console.log(`   Obtenido: ${result.amount}, Esperado: ${testCase.expectedAmount}`);
          failed++;
        }
      } else {
        console.log('✅ PASÓ - Pago detectado');
        passed++;
      }
    }
  } else {
    // NO debe ser procesado (es oferta/spam)
    if (result === null) {
      console.log('✅ PASÓ - Oferta/promoción rechazada correctamente');
      passed++;
    } else {
      console.log('❌ FALLÓ - Se procesó una oferta como pago real');
      console.log(`   ⚠️ Se habría guardado: S/ ${result.amount} de ${result.sender}`);
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
  console.log('\n🎉 ¡Todas las pruebas pasaron! El filtro está funcionando correctamente.\n');
} else {
  console.log('\n⚠️  Algunas ofertas se están procesando como pagos. Revisa los filtros.\n');
  process.exit(1);
}
