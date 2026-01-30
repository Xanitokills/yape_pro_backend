// Debug específico para el caso problemático
const notificationParser = require('./src/services/notificationParser');

const text = 'MARIA LOPEZ PEREZ te envió Bs. 15.50';

console.log('🔍 DEBUG: Probando patrón específico\n');
console.log('Texto:', text);
console.log('Texto normalizado:', text.toLowerCase());
console.log('\n');

// Probar el patrón manualmente
const pattern = /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/im;
const match = text.match(pattern);

console.log('Patrón:', pattern);
console.log('Match:', match);
console.log('\n');

// Probar con el parser
const result = notificationParser.parse(text);
console.log('Resultado del parser:', result);

// Probar solo parseYape
const parseYapeResult = notificationParser.parseYape(text.toLowerCase());
console.log('Resultado parseYape directo:', parseYapeResult);
