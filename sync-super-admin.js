// Script para sincronizar usuario de auth.users a tabla users
require('dotenv').config();
const { supabase } = require('./src/config/database');

async function syncSuperAdmin() {
  const email = 'saavedracastrosandro@gmail.com';
  
  console.log('\n🔍 Buscando usuario en auth.users...');
  
  // 1. Obtener usuario de auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error al listar usuarios:', authError);
    return;
  }
  
  const authUser = authUsers.users.find(u => u.email === email);
  
  if (!authUser) {
    console.error('❌ Usuario no encontrado en auth.users');
    console.log('   Crea el usuario primero en /setup');
    return;
  }
  
  console.log('✅ Usuario encontrado en auth.users:', authUser.id);
  
  // 2. Verificar si ya existe en tabla users
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();
  
  if (existingUser) {
    console.log('⚠️  Usuario ya existe en tabla users, actualizando...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        subscription_plan_id: 'enterprise',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', authUser.id);
    
    if (updateError) {
      console.error('❌ Error al actualizar:', updateError);
      return;
    }
    
    console.log('✅ Usuario actualizado a super_admin');
  } else {
    console.log('📝 Insertando usuario en tabla users...');
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        password_hash: 'supabase_auth',
        full_name: authUser.user_metadata?.full_name || 'Super Admin',
        role: 'super_admin',
        subscription_plan_id: 'enterprise',
        subscription_status: 'active',
        subscription_started_at: new Date().toISOString(),
        is_active: true
      });
    
    if (insertError) {
      console.error('❌ Error al insertar:', insertError);
      return;
    }
    
    console.log('✅ Usuario insertado exitosamente');
  }
  
  // 3. Verificar resultado final
  const { data: finalUser } = await supabase
    .from('users')
    .select('id, email, full_name, role, subscription_plan_id, password_hash')
    .eq('email', email)
    .single();
  
  console.log('\n✅ Configuración final:');
  console.log('   ID:', finalUser.id);
  console.log('   Email:', finalUser.email);
  console.log('   Nombre:', finalUser.full_name);
  console.log('   Role:', finalUser.role);
  console.log('   Plan:', finalUser.subscription_plan_id);
  console.log('   Auth:', finalUser.password_hash);
}

syncSuperAdmin().then(() => {
  console.log('\n✅ Sincronización completada');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
