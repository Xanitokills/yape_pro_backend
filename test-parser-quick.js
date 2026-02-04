// Test rápido del parser
const { parse } = require('./src/services/parsers/index');

const notificacionesTest = [
  'Yape! Juan Perez te envió un pago por S/ 125.50',
  'Maria Lopez te envió S/ 89.00',
  'Recibiste S/ 250.00 de Carlos Rodriguez via yape',
  'Pedro Sanchez te ha plineado S/ 180.00',
  'Laura Martinez te plineó S/ 95.50',
];

console.log('🧪 Probando parser de Perú...\n');

notificacionesTest.forEach((notif, index) => {
  console.log(`\n--- Prueba ${index + 1} ---`);
  console.log('Texto:', notif);
  const resultado = parse(notif, 'PE');
  console.log('Resultado:', resultado);
  console.log('¿Parseado?', resultado ? '✅ SÍ' : '❌ NO');
});
