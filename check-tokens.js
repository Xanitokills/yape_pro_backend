require('dotenv').config();
const { supabase } = require('./src/config/database');

async function checkTokens() {
  console.log('🔍 Consultando tokens FCM activos...\n');
  
  const { data: tokens, error } = await supabase
    .from('fcm_tokens')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📱 Total de tokens activos: ${tokens.length}\n`);
  
  tokens.forEach((token, idx) => {
    console.log(`Token ${idx + 1}:`);
    console.log(`  User ID: ${token.user_id}`);
    console.log(`  Token: ${token.token.substring(0, 30)}...`);
    console.log(`  Device: ${token.device_id || 'N/A'}`);
    console.log(`  Creado: ${token.created_at}`);
    console.log('');
  });
  
  // Ahora buscar los workers de la tienda
  console.log('👥 Buscando workers de la tienda 65d0f212-0ca7-414e-bb0f-58318a60e6b7...\n');
  
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('*')
    .eq('store_id', '65d0f212-0ca7-414e-bb0f-58318a60e6b7')
    .eq('is_active', true);
  
  if (workersError) {
    console.error('❌ Error:', workersError);
    return;
  }
  
  console.log(`👷 Total de workers activos: ${workers.length}\n`);
  
  workers.forEach((worker, idx) => {
    console.log(`Worker ${idx + 1}:`);
    console.log(`  User ID: ${worker.user_id}`);
    console.log(`  Store ID: ${worker.store_id}`);
    console.log('');
    
    // Buscar token de este worker
    const workerToken = tokens.find(t => t.user_id === worker.user_id);
    if (workerToken) {
      console.log(`  ✅ Tiene token FCM: ${workerToken.token.substring(0, 30)}...`);
    } else {
      console.log(`  ❌ NO tiene token FCM registrado`);
    }
    console.log('');
  });
  
  process.exit(0);
}

checkTokens();
