// Test con el mensaje EXACTO de la imagen
const notificationParser = require('./src/services/notificationParser');

console.log('📱 TEST CON MENSAJE REAL DE BOLIVIA\n');
console.log('='.repeat(60));

// Este es el mensaje exacto que aparece en la imagen
const realMessage = `Recibiste un yapeo
QR DE CHOQUE ORTIZ JUAN GABRIEL te envió Bs. 0.30`;

console.log('\n📥 Mensaje de la notificación:');
console.log(realMessage);
console.log('\n' + '─'.repeat(60));

const result = notificationParser.parse(realMessage);

if (result) {
  console.log('\n✅ ¡PARSEADO EXITOSAMENTE!');
  console.log('\n📊 Datos extraídos:');
  console.log(`   💰 Monto: Bs. ${result.amount}`);
  console.log(`   👤 Remitente: ${result.sender}`);
  console.log(`   📱 Fuente: ${result.source}`);
  console.log(`   🇧🇴 País: Bolivia`);
  
  console.log('\n📤 JSON que se enviará al backend:');
  console.log(JSON.stringify({
    amount: result.amount,
    sender_name: result.sender,
    source: result.source,
    message: realMessage,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log('\n🎉 ¡El sistema está listo para Bolivia!');
} else {
  console.log('\n❌ ERROR: No se pudo parsear el mensaje');
  console.log('⚠️  El formato no fue reconocido');
}

console.log('\n' + '='.repeat(60) + '\n');
