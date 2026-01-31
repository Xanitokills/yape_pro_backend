/**
 * Script de Auditoría Rápida
 * Ejecutar: node security-audit.js
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

async function quickSecurityAudit() {
  console.log('🔍 AUDITORÍA DE SEGURIDAD RÁPIDA\n');
  console.log('='.repeat(60));

  try {
    // 1. Contar usuarios por rol
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('role');

    if (usersError) throw usersError;

    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 DISTRIBUCIÓN DE ROLES:');
    console.table(roleCounts);

    // 2. Super admins
    const { data: superAdmins } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('role', 'super_admin')
      .order('created_at', { ascending: false });

    console.log('\n👑 SUPER ADMINISTRADORES:');
    if (superAdmins && superAdmins.length > 0) {
      console.table(superAdmins);
    } else {
      console.log('⚠️  No hay super administradores registrados');
    }

    // 3. Usuarios sospechosos
    const { data: suspicious } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .or('email.like.%hacker%,email.like.%ejemplo%,email.like.%test%');

    console.log('\n🚨 USUARIOS SOSPECHOSOS:');
    if (suspicious && suspicious.length > 0) {
      console.table(suspicious);
      console.log(`\n⚠️  ALERTA: ${suspicious.length} usuarios sospechosos detectados`);
      console.log('💡 Ejecuta: node remove-hackers.js para eliminarlos\n');
    } else {
      console.log('✅ No se detectaron usuarios sospechosos\n');
    }

    // 4. Usuarios recientes (últimas 24 horas)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, full_name, role, created_at')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false });

    console.log('\n🕐 USUARIOS REGISTRADOS (ÚLTIMAS 24H):');
    if (recentUsers && recentUsers.length > 0) {
      console.table(recentUsers);
    } else {
      console.log('Sin nuevos registros');
    }

    // 5. Verificar configuración de seguridad
    console.log('\n🔐 CONFIGURACIÓN DE SEGURIDAD:');
    const securityConfig = {
      'SUPER_ADMIN_SECRET_KEY': process.env.SUPER_ADMIN_SECRET_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA',
      'JWT_SECRET': process.env.JWT_SECRET ? '✅ Configurada' : '❌ NO CONFIGURADA',
      'NODE_ENV': process.env.NODE_ENV || 'development'
    };
    console.table(securityConfig);

    if (!process.env.SUPER_ADMIN_SECRET_KEY) {
      console.log('\n⚠️  ADVERTENCIA: SUPER_ADMIN_SECRET_KEY no está configurada');
      console.log('💡 Configúrala en el archivo .env antes de crear super admins\n');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Auditoría completada\n');

  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
    process.exit(1);
  }
}

// Ejecutar
quickSecurityAudit();
