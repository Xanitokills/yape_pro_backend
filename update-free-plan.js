/**
 * Script para ejecutar la migración de corrección del plan gratis
 * Ejecutar: node backend/update-free-plan.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFreePlan() {
  try {
    console.log('🔧 Actualizando plan gratis...');
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        max_employees: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'free')
      .select();

    if (error) throw error;

    console.log('✅ Plan gratis actualizado exitosamente:');
    console.log(JSON.stringify(data, null, 2));

    // Verificar todos los planes
    const { data: allPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('display_order');

    if (plansError) throw plansError;

    console.log('\n📋 Todos los planes:');
    allPlans.forEach(plan => {
      console.log(`\n- ${plan.name} (${plan.id}):`);
      console.log(`  max_stores: ${plan.max_stores ?? 'ilimitado'}`);
      console.log(`  max_employees: ${plan.max_employees ?? 'ilimitado'}`);
      console.log(`  max_transactions_monthly: ${plan.max_transactions_monthly ?? 'ilimitado'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateFreePlan();
