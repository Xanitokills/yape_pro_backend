// Script para verificar el usuario con el que está iniciando sesión el worker
require('dotenv').config();
const { supabase } = require('./src/config/database');

async function checkWrongUser() {
  try {
    const correctUserId = '24e2a57b-e248-4099-a7a0-30ece048afe8';
    const wrongUserId = '20ecd3ce-6ee4-49a7-a786-36080d27d55b';
    
    console.log('🔍 Verificando usuarios...\n');
    console.log('─'.repeat(80));
    
    // Usuario correcto (el que está en workers)
    const { data: correctUser, error: error1 } = await supabase
      .from('users')
      .select('*')
      .eq('id', correctUserId)
      .single();
    
    console.log('\n✅ USUARIO CORRECTO (en tabla workers):');
    if (correctUser) {
      console.log('  ID:', correctUser.id);
      console.log('  email:', correctUser.email);
      console.log('  full_name:', correctUser.full_name);
      console.log('  phone:', correctUser.phone);
      console.log('  role:', correctUser.role);
      console.log('  country:', correctUser.country);
      console.log('  phone_verified:', correctUser.phone_verified);
      console.log('  created_at:', correctUser.created_at);
    } else {
      console.log('  ❌ No encontrado');
    }
    
    console.log('\n' + '─'.repeat(80));
    
    // Usuario con el que está logueado actualmente
    const { data: wrongUser, error: error2 } = await supabase
      .from('users')
      .select('*')
      .eq('id', wrongUserId)
      .single();
    
    console.log('\n❌ USUARIO CON EL QUE ESTÁ LOGUEADO:');
    if (wrongUser) {
      console.log('  ID:', wrongUser.id);
      console.log('  email:', wrongUser.email);
      console.log('  full_name:', wrongUser.full_name);
      console.log('  phone:', wrongUser.phone);
      console.log('  role:', wrongUser.role);
      console.log('  country:', wrongUser.country);
      console.log('  phone_verified:', wrongUser.phone_verified);
      console.log('  created_at:', wrongUser.created_at);
      
      // Verificar si este usuario está vinculado a algún worker
      const { data: linkedWorker } = await supabase
        .from('workers')
        .select('*')
        .eq('user_id', wrongUserId);
      
      console.log('\n  🔗 Workers vinculados:', linkedWorker?.length || 0);
      if (linkedWorker && linkedWorker.length > 0) {
        linkedWorker.forEach(w => {
          console.log('    - store_id:', w.store_id);
          console.log('      status:', w.registration_status);
          console.log('      active:', w.is_active);
        });
      } else {
        console.log('    ⚠️  Este usuario NO está vinculado a ningún worker');
      }
    } else {
      console.log('  ❌ No encontrado');
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 CONCLUSIÓN:');
    
    if (correctUser && wrongUser) {
      console.log('\n🔴 El worker está iniciando sesión con el usuario INCORRECTO');
      console.log('   Debería usar:', correctUser.email);
      console.log('   Pero está usando:', wrongUser.email);
      
      if (correctUser.phone === wrongUser.phone) {
        console.log('\n⚠️  AMBOS usuarios tienen el mismo teléfono: ' + correctUser.phone);
        console.log('   Esto no debería ser posible (violación de unicidad)');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWrongUser();
