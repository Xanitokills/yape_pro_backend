/**
 * Script de prueba para el endpoint de refresh de caché
 */

const BASE_URL = 'https://yapeprobackend-production.up.railway.app';
// const BASE_URL = 'http://localhost:3000'; // Descomentar para pruebas locales

async function testCacheRefresh() {
  console.log('🧪 Probando endpoint de refresh de caché...\n');
  
  // NOTA: Necesitas un token de super_admin válido
  const token = 'TU_TOKEN_AQUI'; // Reemplazar con token real
  
  if (token === 'TU_TOKEN_AQUI') {
    console.log('⚠️  Debes reemplazar el token con uno válido de super_admin');
    console.log('📝 Obtén tu token desde:');
    console.log('   1. Login en la app como super_admin');
    console.log('   2. O usando el endpoint: POST /api/auth/login\n');
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/notification-patterns/refresh-cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Caché refrescada exitosamente:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error al refrescar caché:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  }
}

// Ejemplo de uso después de modificar un patrón
async function fullExample() {
  console.log('📖 FLUJO COMPLETO DE USO:\n');
  console.log('1️⃣  Modificar patrón desde el panel admin:');
  console.log('   PUT /api/admin/notification-patterns/:id');
  console.log('   → Caché se invalida AUTOMÁTICAMENTE ✅\n');
  
  console.log('2️⃣  O refrescar manualmente si es necesario:');
  console.log('   POST /api/admin/notification-patterns/refresh-cache');
  console.log('   → Útil si hay múltiples cambios o problemas\n');
  
  console.log('3️⃣  Impacto:');
  console.log('   → Antes: Hasta 30 minutos de delay ⏱️');
  console.log('   → Ahora: Inmediato en la próxima notificación ⚡\n');
  
  console.log('═'.repeat(60));
  console.log('Para probar, ejecuta: node test-cache-refresh.js');
  console.log('═'.repeat(60));
}

// Si se ejecuta directamente
if (require.main === module) {
  fullExample();
}

module.exports = { testCacheRefresh };
