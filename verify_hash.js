// Script para verificar si el hash del schema.sql es válido
const bcrypt = require('bcrypt');

const password = 'Admin123!';
const hashFromSchema = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

console.log('\n=== VERIFICACION DE HASH ===');
console.log('Contraseña a probar:', password);
console.log('Hash del schema.sql:', hashFromSchema);

bcrypt.compare(password, hashFromSchema, (err, result) => {
  if (err) {
    console.error('Error al comparar:', err);
    process.exit(1);
  }
  
  console.log('\n¿El hash coincide con Admin123!?:', result);
  
  if (!result) {
    console.log('\n⚠️ EL HASH DEL SCHEMA.SQL NO ES VÁLIDO PARA "Admin123!"');
    console.log('El hash del schema parece ser para otra contraseña.');
    console.log('\nProbando contraseñas comunes...');
    
    const commonPasswords = [
      'password',
      'admin123',
      'Admin123',
      '123456',
      'Password123!',
      'Password1',
      'admin'
    ];
    
    commonPasswords.forEach(pwd => {
      bcrypt.compare(pwd, hashFromSchema, (err, match) => {
        if (match) {
          console.log(`✅ ENCONTRADO: El hash es para "${pwd}"`);
        }
      });
    });
  } else {
    console.log('\n✅ El hash es correcto para Admin123!');
  }
});
