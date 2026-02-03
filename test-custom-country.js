// test-custom-country.js
// Prueba de integración para verificar soporte de nuevos países y billeteras en tiempo real

const { supabase } = require('./src/config/database');
const dynamicParser = require('./src/services/parsers/dynamicParser');

// Configuración de prueba
const TEST_COUNTRY = 'ATLANTIS'; // Un país que definitivamente no existe
const TEST_WALLET = 'SHELL_COIN'; // Una billetera inventada
const TEST_PATTERN = 'recibiste (\\d+) conchas de ([a-zA-Z ]+)';
const TEST_TEXT = 'Ping! recibiste 50 conchas de Rey Triton en tu cuenta';

async function testCustomCountrySupport() {
  console.log('🧜 INICIANDO PRUEBA DE PAÍS PERSONALIZADO (ATLANTIS)\n');
  
  let patternId = null;

  try {
    // 1. Insertar un patrón con país/billetera nuevos
    console.log(`1. Creando patrón para país: ${TEST_COUNTRY}, billetera: ${TEST_WALLET}...`);
    
    // NOTA: Esto solo funciona si la restricción CHECK ha sido eliminada de la BD
    const { data, error } = await supabase
      .from('notification_patterns')
      .insert({
        country: TEST_COUNTRY,
        wallet_type: TEST_WALLET,
        pattern: TEST_PATTERN,
        amount_group: 1,
        sender_group: 2,
        priority: 10,
        name: 'Test Atlantis Payment',
        description: 'Pago en conchas marinas',
        example: 'recibiste 100 conchas de Ariel',
        is_active: true,
        currency: 'SHL'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Fallo al crear patrón (probablemente restricción de BD activa): ${error.message}`);
    }

    patternId = data.id;
    console.log(`✅ Patrón creado exitosamente con ID: ${patternId}`);

    // 2. Invalidar caché del parser para asegurar que lea el nuevo patrón
    console.log('2. Actualizando caché del parser...');
    dynamicParser.refreshCache();

    // 3. Probar el parser con el texto de prueba
    console.log(`3. Probando texto: "${TEST_TEXT}"`);
    const result = await dynamicParser.parse(TEST_TEXT, TEST_COUNTRY);

    // 4. Verificar resultados
    if (result && result.amount === 50 && result.source === TEST_WALLET) {
      console.log('\n✨ ¡ÉXITO! El sistema reconoció el país y billetera personalizados.');
      console.log('---------------------------------------------------');
      console.log('Detalle del resultado:', JSON.stringify(result, null, 2));
      console.log('---------------------------------------------------');
    } else {
      console.error('\n❌ FALLO: El parser no extrajo la información correcta.');
      console.error('Resultado:', result);
    }

  } catch (err) {
    console.error('\n❌ ERROR CRÍTICO:', err.message);
    if (err.message.includes('violates check constraint')) {
      console.error('💡 PISTA: Debes ejecutar la migración 004_allow_dynamic_types.sql para permitir nuevos países.');
    }
  } finally {
    // 5. Limpieza
    if (patternId) {
      console.log('\n🧹 Limpiando datos de prueba...');
      await supabase.from('notification_patterns').delete().eq('id', patternId);
      console.log('✅ Datos limpios');
    }
  }
}

// Ejecutar prueba
testCustomCountrySupport();
