// Script para generar hash de contraseña con bcrypt
const bcrypt = require('bcrypt');

const password = 'Admin123!';
const rounds = 10;

bcrypt.hash(password, rounds, (err, hash) => {
  if (err) {
    console.error('Error generando hash:', err);
    process.exit(1);
  }
  
  console.log('\n=== HASH GENERADO ===');
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL UPDATE ===');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@yapepro.com';`);
  console.log('\n');
});
