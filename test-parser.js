// Test del parser de notificaciones
const notificationParser = require('./src/services/notificationParser');

// Caso de prueba con el mensaje real
const testMessage = "Confirmación de Pago Yape! SANDRO ANTHONIONY SAAVEDRA CASTRO te envió un pago por S/ 1 Yape! SANDRO ANTHONIONY SAAVEDRA CASTRO te envió un pago por S/ 1";

console.log('📱 Mensaje original:');
console.log(testMessage);
console.log('\n' + '='.repeat(50) + '\n');

const result = notificationParser.parse(testMessage);

console.log('✅ Resultado parseado:');
console.log('Nombre:', result.sender);
console.log('Monto: S/', result.amount);
console.log('Fuente:', result.source);
console.log('\n' + '='.repeat(50) + '\n');

// Simulación de limpieza de nombre (como en dashboard)
function cleanSenderName(senderName) {
  if (!senderName) return 'Cliente Anónimo';
  
  let cleanName = senderName.trim();
  
  // Eliminar texto de confirmación y prefijos
  const patterns = [
    /^(?:confirmación de pago\s+)?yape!?\s*/i,
    /^(?:confirmación de\s+)?plin!?\s*/i,
    /^pago recibido\s+/i,
    /^recibiste\s+.*?de\s+/i,
    /\s+te\s+envió\s+un\s+pago.*$/i,
  ];
  
  for (const pattern of patterns) {
    cleanName = cleanName.replace(pattern, '');
  }
  
  // Convertir a formato título
  cleanName = cleanName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleanName.trim() || 'Cliente Anónimo';
}

console.log('🧹 Nombre limpio (para mostrar):');
console.log(cleanSenderName(result.sender));
console.log('\n✨ Resultado final para mostrar:');
console.log(`${cleanSenderName(result.sender)} - S/ ${result.amount}`);
