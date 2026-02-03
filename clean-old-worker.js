// Script para eliminar el usuario worker viejo que no está vinculado
require('dotenv').config();
const { supabase } = require('./src/config/database');

async function cleanOldWorker() {
  try {
    const oldUserId = '20ecd3ce-6ee4-49a7-a786-36080d27d55b';
    const correctUserId = '24e2a57b-e248-4099-a7a0-30ece048afe8';
    
    console.log('🔍 Iniciando limpieza del usuario viejo...\n');
    console.log('─'.repeat(80));
    
    // 1. Verificar el usuario viejo antes de eliminar
    const { data: oldUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', oldUserId)
      .single();
    
    if (!oldUser) {
      console.log('✅ El usuario viejo ya no existe. Limpieza no necesaria.');
      return;
    }
    
    console.log('\n❌ Usuario viejo encontrado (será eliminado):');
    console.log('  ID:', oldUser.id);
    console.log('  Email:', oldUser.email);
    console.log('  Phone:', oldUser.phone);
    console.log('  Full Name:', oldUser.full_name);
    console.log('  Role:', oldUser.role);
    
    // 2. Verificar que NO esté vinculado a ningún worker
    const { data: linkedWorkers, count } = await supabase
      .from('workers')
      .select('*', { count: 'exact' })
      .eq('user_id', oldUserId);
    
    if (count > 0) {
      console.log('\n⚠️  ADVERTENCIA: Este usuario SÍ está vinculado a workers:');
      linkedWorkers.forEach(w => {
        console.log('  - Worker ID:', w.id, 'Store:', w.store_id);
      });
      console.log('\n❌ NO se puede eliminar. Cancelando operación.');
      return;
    }
    
    console.log('\n✅ Verificado: Usuario NO está vinculado a ningún worker');
    
    // 3. Verificar FCM tokens
    const { data: fcmTokens } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', oldUserId);
    
    if (fcmTokens && fcmTokens.length > 0) {
      console.log(`\n🔑 Encontrados ${fcmTokens.length} FCM tokens que serán eliminados`);
    }
    
    // 4. Eliminar FCM tokens
    const { error: fcmError } = await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', oldUserId);
    
    if (fcmError) {
      console.error('\n❌ Error al eliminar FCM tokens:', fcmError);
      return;
    }
    
    console.log('✅ FCM tokens eliminados');
    
    // 5. Eliminar el usuario viejo
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldUserId);
    
    if (deleteError) {
      console.error('\n❌ Error al eliminar usuario:', deleteError);
      return;
    }
    
    console.log('✅ Usuario viejo eliminado exitosamente');
    
    // 6. Verificar el usuario correcto
    console.log('\n' + '─'.repeat(80));
    const { data: correctUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', correctUserId)
      .single();
    
    if (!correctUser) {
      console.log('❌ ERROR: El usuario correcto no existe!');
      return;
    }
    
    console.log('\n✅ Usuario correcto verificado (debe permanecer):');
    console.log('  ID:', correctUser.id);
    console.log('  Email:', correctUser.email);
    console.log('  Phone:', correctUser.phone);
    console.log('  Full Name:', correctUser.full_name);
    
    // 7. Verificar worker vinculado
    const { data: correctWorker } = await supabase
      .from('workers')
      .select('id, store_id, registration_status, is_active')
      .eq('user_id', correctUserId);
    
    if (correctWorker && correctWorker.length > 0) {
      console.log('\n✅ Worker correctamente vinculado:');
      correctWorker.forEach(w => {
        console.log('  - Worker ID:', w.id);
        console.log('    Store ID:', w.store_id);
        console.log('    Status:', w.registration_status);
        console.log('    Active:', w.is_active);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ LIMPIEZA COMPLETADA EXITOSAMENTE');
    console.log('\n📱 Siguiente paso: El worker debe cerrar sesión y volver a iniciar con:');
    console.log('   Teléfono: +51976260401');
    console.log('   Contraseña: la que usó al completar el registro');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

cleanOldWorker();
