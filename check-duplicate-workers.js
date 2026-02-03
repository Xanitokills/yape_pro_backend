// Script para verificar si hay registros duplicados de workers con el mismo teléfono
require('dotenv').config();
const { supabase } = require('./src/config/database');

async function checkDuplicateWorkers() {
  try {
    const phone = '+51976260401';
    
    console.log('🔍 Buscando todos los workers con teléfono:', phone);
    console.log('─'.repeat(80));
    
    // Buscar en workers
    const { data: workers, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .eq('temp_phone', phone);
    
    if (workersError) {
      console.error('❌ Error al buscar workers:', workersError);
      return;
    }
    
    console.log('\n📋 WORKERS ENCONTRADOS:', workers?.length || 0);
    if (workers && workers.length > 0) {
      workers.forEach((worker, index) => {
        console.log(`\n[Worker ${index + 1}]`);
        console.log('  ID:', worker.id);
        console.log('  user_id:', worker.user_id);
        console.log('  store_id:', worker.store_id);
        console.log('  temp_phone:', worker.temp_phone);
        console.log('  temp_full_name:', worker.temp_full_name);
        console.log('  invitation_code:', worker.invitation_code);
        console.log('  registration_status:', worker.registration_status);
        console.log('  is_active:', worker.is_active);
        console.log('  created_at:', worker.created_at);
      });
    }
    
    // Buscar en users
    console.log('\n' + '─'.repeat(80));
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone);
    
    if (usersError) {
      console.error('❌ Error al buscar users:', usersError);
      return;
    }
    
    console.log('\n👤 USUARIOS ENCONTRADOS:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n[User ${index + 1}]`);
        console.log('  ID:', user.id);
        console.log('  email:', user.email);
        console.log('  full_name:', user.full_name);
        console.log('  phone:', user.phone);
        console.log('  role:', user.role);
        console.log('  country:', user.country);
        console.log('  phone_verified:', user.phone_verified);
        console.log('  created_at:', user.created_at);
      });
    }
    
    // Análisis
    console.log('\n' + '─'.repeat(80));
    console.log('📊 ANÁLISIS:');
    
    if (workers && workers.length > 1) {
      console.log('\n⚠️  PROBLEMA: Hay ' + workers.length + ' registros de worker con el mismo teléfono');
      console.log('Esto puede causar conflictos en la asociación worker-store');
    }
    
    if (users && users.length > 1) {
      console.log('\n⚠️  PROBLEMA: Hay ' + users.length + ' usuarios con el mismo teléfono');
      console.log('Esto viola la restricción de unicidad del teléfono');
    }
    
    if (workers && users) {
      const workerUserIds = workers.map(w => w.user_id).filter(Boolean);
      const userIds = users.map(u => u.id);
      
      console.log('\n🔗 Verificando coincidencia de user_id:');
      console.log('  user_ids en workers:', workerUserIds);
      console.log('  user_ids en users:', userIds);
      
      const unmatchedWorkerIds = workerUserIds.filter(id => !userIds.includes(id));
      const unmatchedUserIds = userIds.filter(id => !workerUserIds.includes(id));
      
      if (unmatchedWorkerIds.length > 0) {
        console.log('\n❌ Workers con user_id que NO existe en users:', unmatchedWorkerIds);
      }
      
      if (unmatchedUserIds.length > 0) {
        console.log('\n⚠️  Usuarios que NO están vinculados en workers:', unmatchedUserIds);
      }
      
      if (unmatchedWorkerIds.length === 0 && unmatchedUserIds.length === 0 && workerUserIds.length === userIds.length) {
        console.log('\n✅ Todos los user_id coinciden correctamente');
      }
    }
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDuplicateWorkers();
