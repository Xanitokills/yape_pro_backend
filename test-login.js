// Script para probar login y verificar usuario
require('dotenv').config();
const { supabase } = require('./src/config/database');

async function testLogin() {
  const email = 'saavedracastrosandro@gmail.com';
  
  console.log('\n🔍 Verificando usuario en tabla users...');
  
  // 1. Buscar en tabla users
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('❌ Error al buscar usuario:', error);
    return;
  }
  
  if (!user) {
    console.error('❌ Usuario no encontrado en tabla users');
    return;
  }
  
  console.log('✅ Usuario encontrado:', {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    password_hash: user.password_hash,
    is_active: user.is_active,
    subscription_plan_id: user.subscription_plan_id
  });
  
  // 2. Probar login con Supabase Auth
  console.log('\n🔐 Probando login con Supabase Auth...');
  const password = 'Kmzwa8awaa'; // La contraseña que usaste
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (authError) {
    console.error('❌ Error en auth:', authError.message);
  } else {
    console.log('✅ Login exitoso con Supabase Auth');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
  }
}

testLogin().then(() => {
  console.log('\n✅ Test completado');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
