/**
 * Script de Emergencia: Eliminar usuarios hackers
 * Ejecutar: node remove-hackers.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditAndRemoveHackers() {
  console.log('🔍 Iniciando auditoría de seguridad...\n');

  // 1. Ver todos los super_admin actuales
  console.log('📋 SUPER ADMINISTRADORES ACTUALES:');
  const { data: superAdmins, error: superAdminError } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('role', 'super_admin')
    .order('created_at', { ascending: false });

  if (superAdminError) {
    console.error('❌ Error al obtener super admins:', superAdminError);
  } else {
    console.table(superAdmins);
  }

  // 2. Buscar usuarios sospechosos
  console.log('\n🚨 USUARIOS SOSPECHOSOS DETECTADOS:');
  const { data: suspicious, error: suspiciousError } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, phone')
    .or('email.like.%hacker%,email.like.%ejemplo%,email.like.%test%,email.eq.elcalvito7w@gmail.com')
    .order('created_at', { ascending: false });

  if (suspiciousError) {
    console.error('❌ Error al buscar usuarios sospechosos:', suspiciousError);
  } else if (suspicious && suspicious.length > 0) {
    console.table(suspicious);
    
    // 3. Confirmar eliminación
    console.log('\n⚠️  ATENCIÓN: Se encontraron', suspicious.length, 'usuarios sospechosos');
    console.log('⚠️  Estos usuarios serán ELIMINADOS PERMANENTEMENTE');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n¿Deseas eliminar estos usuarios? (escribe "SI" para confirmar): ', async (answer) => {
      if (answer.toUpperCase() === 'SI') {
        console.log('\n🗑️  Eliminando usuarios...');
        
        const idsToDelete = suspicious.map(u => u.id);
        
        const { data: deleted, error: deleteError } = await supabase
          .from('users')
          .delete()
          .in('id', idsToDelete)
          .select();

        if (deleteError) {
          console.error('❌ Error al eliminar usuarios:', deleteError);
        } else {
          console.log('✅ Usuarios eliminados exitosamente:', deleted.length);
          console.table(deleted);
        }
      } else {
        console.log('❌ Operación cancelada. No se eliminó ningún usuario.');
      }
      
      rl.close();
      
      // 4. Verificación final
      console.log('\n✅ Auditoría completada. Verificando super_admins restantes...');
      const { data: finalCheck } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('role', 'super_admin');
      
      console.log('\n📋 SUPER ADMINS FINALES:');
      console.table(finalCheck);
    });

  } else {
    console.log('✅ No se encontraron usuarios sospechosos');
    process.exit(0);
  }
}

// Ejecutar
auditAndRemoveHackers().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
