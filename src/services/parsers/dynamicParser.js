// src/services/parsers/dynamicParser.js
/**
 * Parser Dinámico de Notificaciones
 * Lee patrones desde la base de datos y los aplica según configuración
 */
const { supabase } = require('../../config/database');

// Caché de patrones para evitar queries constantes
let patternsCache = {
  data: [],
  lastUpdated: 0,
  ttl: 5 * 60 * 1000 // 5 minutos de TTL
};

/**
 * Obtener patrones activos desde la BD con caché en memoria
 */
async function getActivePatterns(country, walletType) {
  const now = Date.now();
  
  // Actualizar caché si expiró
  if (now - patternsCache.lastUpdated > patternsCache.ttl || patternsCache.data.length === 0) {
    console.log('🔄 Actualizando caché de patrones de notificación...');
    try {
      const { data, error } = await supabase
        .from('notification_patterns')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true }); // Menor número = mayor prioridad
        
      if (error) {
        console.error('❌ Error cargando patrones:', error);
        // Si hay error y tenemos caché, usarla aunque sea vieja
        if (patternsCache.data.length === 0) return [];
      } else {
        patternsCache.data = data || [];
        patternsCache.lastUpdated = now;
        console.log(`✅ Caché actualizada: ${patternsCache.data.length} patrones`);
      }
    } catch (e) {
      console.error('❌ Excepción cargando patrones:', e);
      if (patternsCache.data.length === 0) return [];
    }
  }
  
  // Filtrar patrones relevantes
  return patternsCache.data.filter(p => {
    // Coincidencia de país (o 'ALL')
    const countryMatch = p.country === 'ALL' || (!country) || p.country === country;
    
    // Coincidencia de billetera (si se especifica)
    const walletMatch = (!walletType) || p.wallet_type === walletType;
    
    return countryMatch && walletMatch;
  });
}

/**
 * Función principal de parsing dinámico
 * @param {string} text Texto de la notificación
 * @param {string} country Código de país (PE, BO)
 */
async function parse(text, country = 'PE') {
  if (!text || typeof text !== 'string') return null;
  
  // Normalizar texto (eliminar saltos múltiples, espacios extra)
  // Nota: No convertimos a lowercase aquí porque algunos patrones pueden ser case-sensitive
  const cleanText = text.trim().replace(/\s+/g, ' ');
  
  // Obtener patrones aplicables ordenados por prioridad
  const patterns = await getActivePatterns(country);
  
  console.log(`🔍 Probando ${patterns.length} patrones dinámicos para ${country}...`);
  
  for (const p of patterns) {
    try {
      // Crear regex desde string almacenado en BD
      const regex = new RegExp(p.pattern, p.regex_flags || 'i');
      const match = text.match(regex); // Usar texto original para mantener multilínea si es necesario
      
      if (match) {
        console.log(`✅ Match con patrón: "${p.name}" (ID: ${p.id})`);
        
        // Extraer monto
        // p.amount_group es 1-based index de grupo regex
        let amount = null;
        if (match[p.amount_group]) {
          // Limpiar el monto de símbolos extraños si la regex capturó de más
          // Solo dejar números y punto decimal
          const amountStr = match[p.amount_group].replace(/[^\d.]/g, '');
          amount = parseFloat(amountStr);
        }
        
        // Extraer remitente
        // p.sender_group es 1-based index de grupo regex
        let sender = 'Desconocido';
        if (p.sender_group > 0 && match[p.sender_group]) {
          sender = match[p.sender_group].trim();
        }
        
        // Si tenemos un monto válido, retornamos el resultado
        if (amount !== null && !isNaN(amount)) {
          // Registrar éxito en log (asíncrono, no bloqueante)
          logParsingResult(text, country, p.id, true, amount, sender, p.wallet_type).catch(console.error);
          
          return {
            amount,
            sender,
            source: p.wallet_type,
            currency: p.currency,
            pattern_id: p.id,
            raw_match: match[0]
          };
        }
      }
    } catch (e) {
      console.error(`❌ Error evaluando patrón "${p.name}":`, e);
    }
  }
  
  // Si llegamos aquí, ningún patrón coincidió
  console.log('⚠️ Ningún patrón dinámico coincidió');
  
  // Registrar fallo en log (solo usamos el primer patrón o null para referencia)
  logParsingResult(text, country, null, false, null, null, null).catch(console.error);
  
  return null;
}

/**
 * Registrar resultado del parsing para auditoría y mejora
 */
async function logParsingResult(text, country, patternId, success, amount, sender, source) {
  try {
    // Solo loguear un muestreo aleatorio para no llenar la BD (ej: 10% de los casos o todos los fallos)
    if (success && Math.random() > 0.1) return;
    
    await supabase.from('notification_parsing_logs').insert([{
      notification_text: text.substring(0, 1000), // Limitar longitud
      country,
      pattern_id: patternId,
      success,
      extracted_amount: amount,
      extracted_sender: sender ? sender.substring(0, 255) : null,
      extracted_source: source
    }]);
  } catch (e) {
    // Ignorar errores de log
  }
}

/**
 * Forzar recarga de caché (útil después de actualizar patrones desde admin)
 */
function refreshCache() {
  patternsCache.data = [];
  patternsCache.lastUpdated = 0;
  console.log('🔄 Caché de patrones invalidada');
}

module.exports = {
  parse,
  refreshCache,
  getActivePatterns
};
