// Test de filtros de notificaciones - Yape Smart
const notificationParser = require('./src/services/notificationParser');

console.log('🧪 PRUEBAS DE FILTRO DE NOTIFICACIONES\n');
console.log('='*60);

const testCases = [
  // ✅ CASOS QUE DEBEN PROCESARSE (Pagos Recibidos)
  {
    name: 'Yape - Formato actual (te envió un pago)',
    text: 'Confirmación de Pago Yape! JUAN PÉREZ GARCÍA te envió un pago por S/ 50.00',
    shouldProcess: true,
    expectedAmount: 50.00,
    expectedSender: 'JUAN PÉREZ GARCÍA'
  },
  {
    name: 'Yape - Formato corto (te envió)',
    text: 'MARÍA LÓPEZ te envió S/ 25.50',
    shouldProcess: true,
    expectedAmount: 25.50,
    expectedSender: 'MARÍA LÓPEZ'
  },
  {
    name: 'Yape - te ha yapeado',
    text: 'CARLOS RUIZ te ha yapeado S/ 100',
    shouldProcess: true,
    expectedAmount: 100,
    expectedSender: 'CARLOS RUIZ'
  },
  {
    name: 'Yape - te yapeó',
    text: 'SANDRA TORRES te yapeó S/ 75.00',
    shouldProcess: true,
    expectedAmount: 75.00,
    expectedSender: 'SANDRA TORRES'
  },
  {
    name: 'Plin - te ha plineado',
    text: 'JOSÉ MARTÍNEZ te ha plineado S/ 60.00',
    shouldProcess: true,
    expectedAmount: 60.00
  },
  {
    name: 'Plin - te plineó',
    text: 'ANA SILVA te plineó S/ 30.50',
    shouldProcess: true,
    expectedAmount: 30.50
  },
  {
    name: 'Formato antiguo - Recibiste de',
    text: 'Recibiste S/ 45.00 de PEDRO GONZÁLEZ via Yape',
    shouldProcess: true,
    expectedAmount: 45.00,
    expectedSender: 'PEDRO GONZÁLEZ'
  },
  
  // 🚫 CASOS QUE DEBEN RECHAZARSE (Pagos Enviados)
  {
    name: 'Yape - Enviaste dinero',
    text: 'Enviaste S/ 50.00 a JUAN PÉREZ',
    shouldProcess: false
  },
  {
    name: 'Yape - Le yapeaste',
    text: 'Le yapeaste S/ 30 a MARÍA LÓPEZ',
    shouldProcess: false
  },
  {
    name: 'Yape - Le yapeast (informal)',
    text: 'Le yapeast S/ 25.50 a Carlos',
    shouldProcess: false
  },
  {
    name: 'Pago genérico - Pagaste',
    text: 'Pagaste S/ 100 a TIENDA XYZ',
    shouldProcess: false
  },
  {
    name: 'Plin - Le plineaste',
    text: 'Le plineaste S/ 45.00 a CARLOS RUIZ',
    shouldProcess: false
  },
  {
    name: 'Plin - Le plineast (informal)',
    text: 'Le plineast S/ 20 a Ana',
    shouldProcess: false
  },
  {
    name: 'Transferencia - Transferiste',
    text: 'Transferiste S/ 200 a cuenta 123456',
    shouldProcess: false
  },
  {
    name: 'Pago realizado - Hiciste',
    text: 'Hiciste un pago de S/ 75.00',
    shouldProcess: false
  },
  {
    name: 'Pago realizado - Realizaste',
    text: 'Realizaste un pago de S/ 50.00',
    shouldProcess: false
  },
  {
    name: 'Enviaste un pago genérico',
    text: 'Enviaste un pago de S/ 35 a María',
    shouldProcess: false
  },
  
  // 🚫 SPAM Y PROMOCIONES (Deben rechazarse)
  {
    name: 'Spam - Aprovecha descuento',
    text: 'Aprovecha 20% de descuento en tu próximo Yape',
    shouldProcess: false
  },
  {
    name: 'Spam - Promoción',
    text: 'Nueva promoción: Gana hasta S/ 50 en cashback',
    shouldProcess: false
  },
  {
    name: 'Spam - Oferta especial',
    text: 'Oferta especial para ti en Yape',
    shouldProcess: false
  },
  {
    name: 'Spam - Sorteo',
    text: 'Participa en el sorteo de S/ 1000 con Yape',
    shouldProcess: false
  },
  {
    name: 'Spam - Actualización',
    text: 'Actualiza tu app Yape a la nueva versión',
    shouldProcess: false
  },
  {
    name: 'Spam - Recordatorio',
    text: 'Recordatorio: Tienes un pago pendiente',
    shouldProcess: false
  },
  {
    name: 'Spam - Seguridad',
    text: 'Protege tu cuenta Yape con estos consejos de seguridad',
    shouldProcess: false
  },
  {
    name: 'Spam - Invitación',
    text: 'Yape te invita a conocer las nuevas funciones',
    shouldProcess: false
  },
  {
    name: 'Spam - Descubre',
    text: 'Descubre todo lo nuevo en Yape',
    shouldProcess: false
  },
  {
    name: 'Spam - Configura cuenta',
    text: 'Configura tu cuenta para aprovechar todos los beneficios',
    shouldProcess: false
  },
  {
    name: 'Spam - Verifica identidad',
    text: 'Verifica tu identidad para mayor seguridad',
    shouldProcess: false
  },
  {
    name: 'Sin monto - Notificación general',
    text: 'Tu cuenta Yape está lista para usar',
    shouldProcess: false
  },
  {
    name: 'Sin monto - Estado de cuenta',
    text: 'Revisa el estado de tu cuenta Yape',
    shouldProcess: false
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Input: "${test.text}"`);
  
  const result = notificationParser.parse(test.text);
  
  if (test.shouldProcess) {
    // Debe procesar
    if (result !== null) {
      console.log(`   ✅ PASS - Se procesó correctamente`);
      console.log(`      Monto: S/ ${result.amount}`);
      console.log(`      Remitente: ${result.sender}`);
      console.log(`      Fuente: ${result.source}`);
      
      // Validar monto si está especificado
      if (test.expectedAmount && result.amount !== test.expectedAmount) {
        console.log(`   ⚠️  WARNING - Monto esperado: ${test.expectedAmount}, obtenido: ${result.amount}`);
      }
      
      // Validar remitente si está especificado
      if (test.expectedSender) {
        const senderMatch = result.sender.toLowerCase().includes(test.expectedSender.toLowerCase().split(' ')[0]);
        if (!senderMatch) {
          console.log(`   ⚠️  WARNING - Remitente esperado: ${test.expectedSender}, obtenido: ${result.sender}`);
        }
      }
      
      passed++;
    } else {
      console.log(`   ❌ FAIL - NO se procesó (debería procesarse)`);
      failed++;
    }
  } else {
    // NO debe procesar
    if (result === null) {
      console.log(`   ✅ PASS - Correctamente rechazado`);
      passed++;
    } else {
      console.log(`   ❌ FAIL - Se procesó cuando NO debería`);
      console.log(`      Resultado: ${JSON.stringify(result)}`);
      failed++;
    }
  }
});

console.log('\n' + '='*60);
console.log('\n📊 RESULTADOS FINALES:');
console.log(`   ✅ Pasaron: ${passed}/${testCases.length}`);
console.log(`   ❌ Fallaron: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  console.log('   El filtro está funcionando correctamente.');
} else {
  console.log('\n⚠️  ALGUNOS TESTS FALLARON');
  console.log('   Revisa los casos fallidos arriba.');
}

console.log('\n' + '='*60);
