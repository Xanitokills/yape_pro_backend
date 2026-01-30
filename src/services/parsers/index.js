// src/services/parsers/index.js
/**
 * Sistema de parsers por país
 * Enrutador principal que delega al parser específico de cada país
 */

const peruParser = require('./peruParser');
const boliviaParser = require('./boliviaParser');
const { getCountry, hasParser } = require('../../config/countries');

/**
 * Filtros comunes para todos los países
 */

/**
 * Filtro 1: Rechazar pagos salientes
 */
function isOutgoingPayment(text) {
  const normalizedText = text.toLowerCase();
  
  const outgoingPatterns = [
    /enviaste\s+(?:s\/|bs\.|r\$|\$|€)/i,
    /le\s+(yapeaste|yapeast|plineaste|plineast)\s+/i,
    /pagaste\s+(?:s\/|bs\.|r\$|\$|€)/i,
    /transferiste\s+(?:s\/|bs\.|r\$|\$|€)/i,
    /enviaste\s+un\s+pago/i,
    /hiciste\s+un\s+pago/i,
    /realizaste\s+un\s+pago/i
  ];
  
  return outgoingPatterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Filtro 2: Rechazar spam y promociones
 */
function isSpam(text) {
  const normalizedText = text.toLowerCase();
  
  const spamPatterns = [
    // Palabras de marketing
    /aprovecha/i,
    /descuento/i,
    /promoción|promocion/i,
    /oferta/i,
    /gana\s+(hasta|un|dinero|puntos)/i,
    /sorteo/i,
    /premio/i,
    // Ofertas de productos
    /productos?\s+(?:desde|a|por|hasta)/i,
    /compra\s+(?:ahora|ya|con)/i,
    /pide\s+(?:ahora|ya)/i,
    /paga\s+con\s+(?:yape|bizum|pix)/i,
    /tiene\s+productos?/i,
    /zapatillas?\s+desde/i,
    /combo\s+a\s+/i,
    /pizza\s+(?:grande|mediana|familiar)\s+a\s+/i,
    // Rangos de precios
    /desde\s+(?:s\/|bs\.|r\$|\$|€)/i,
    /hasta\s+(?:s\/|bs\.|r\$|\$|€)/i,
    /desde\s+.*hasta\s+/i,
    // Mensajes de apps
    /actualiza\s+(tu\s+)?app/i,
    /nueva\s+versión|nueva\s+version/i,
    /recordatorio/i,
    /pendiente/i,
    /vence/i,
    /protege\s+tu\s+cuenta/i,
    /seguridad/i,
    /te\s+invita/i,
    /conoce/i,
    /descubre/i,
    /nuevo.*en\s+/i,
    /activa/i,
    /configura/i,
    /completa\s+tu\s+perfil/i,
    /verifica\s+tu/i,
    /confirma\s+tu/i
  ];
  
  return spamPatterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Filtro 3: Verificar que contiene un monto válido
 */
function hasValidAmount(text) {
  const normalizedText = text.toLowerCase();
  
  // Patrones de moneda de todos los países
  const currencyPatterns = [
    /s\/\s*\d/i,      // Perú: S/
    /bs\.\s*\d/i,     // Bolivia/Venezuela: Bs.
    /r\$\s*\d/i,      // Brasil: R$
    /\$\s*\d/i,       // México, Chile, Colombia, etc: $
    /€\s*\d/i,        // España: €
    /₡\s*\d/i,        // Costa Rica: ₡
    /₲\s*\d/i,        // Paraguay: ₲
    /q\s*\d/i,        // Guatemala: Q
    /l\s*\d/i,        // Honduras: L
    /c\$\s*\d/i,      // Nicaragua: C$
    /b\/\.\s*\d/i,    // Panamá: B/.
    /rd\$\s*\d/i      // Rep. Dominicana: RD$
  ];
  
  return currencyPatterns.some(pattern => pattern.test(normalizedText));
}

/**
 * Parser principal con enrutamiento por país
 */
function parse(text, country = 'PE') {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  // Aplicar filtros comunes
  const normalizedText = text.toLowerCase().trim();
  
  // Filtro 1: Rechazar pagos salientes
  if (isOutgoingPayment(normalizedText)) {
    console.log('🚫 PAGO SALIENTE DETECTADO - NO SE PROCESARÁ');
    console.log('   Este es un pago que TÚ enviaste, no uno que recibiste');
    return null;
  }
  
  // Filtro 2: Rechazar spam/promociones
  if (isSpam(normalizedText)) {
    console.log('🚫 SPAM/PROMOCIÓN DETECTADO - NO SE PROCESARÁ');
    console.log('   Esta es una notificación promocional, no un pago real');
    return null;
  }
  
  // Filtro 3: Verificar monto válido
  if (!hasValidAmount(normalizedText)) {
    console.log('🚫 NO CONTIENE MONTO - NO SE PROCESARÁ');
    console.log('   La notificación no tiene un monto válido');
    return null;
  }
  
  console.log('✅ Notificación validada - es un pago entrante real');
  
  // Verificar que el país existe
  const countryConfig = getCountry(country);
  if (!countryConfig) {
    console.warn(`⚠️ País '${country}' no configurado, usando parser genérico`);
    return parseGeneric(text);
  }
  
  // Enrutar al parser específico del país
  let result = null;
  
  switch(country.toUpperCase()) {
    case 'PE':
      result = peruParser.parse(text);
      break;
      
    case 'BO':
      result = boliviaParser.parse(text);
      break;
      
    // Países sin parser específico aún - usar genérico
    case 'AR':
    case 'BR':
    case 'CL':
    case 'CO':
    case 'MX':
    case 'ES':
    default:
      console.log(`ℹ️ Parser específico para ${country} no implementado, usando genérico`);
      result = parseGeneric(text, countryConfig.currencySymbol);
      if (result) {
        result.currency = countryConfig.currency;
      }
      break;
  }
  
  return result;
}

/**
 * Parser genérico para países sin parser específico
 */
function parseGeneric(text, currencySymbol = null) {
  // Detectar moneda si no se proporcionó
  const currencies = ['s/', 'bs.', 'r$', '$', '€', '₡', '₲', 'q', 'l', 'c$', 'b/.', 'rd$'];
  let detectedCurrency = currencySymbol;
  
  if (!detectedCurrency) {
    for (const curr of currencies) {
      if (text.toLowerCase().includes(curr)) {
        detectedCurrency = curr;
        break;
      }
    }
  }
  
  if (!detectedCurrency) {
    return null;
  }
  
  // Buscar monto con la moneda detectada
  const escapedCurrency = detectedCurrency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const amountPattern = new RegExp(`${escapedCurrency}\\s*(\\d+(?:\\.\\d{2})?)`, 'i');
  const match = text.match(amountPattern);
  
  if (!match) {
    return null;
  }
  
  const amount = parseFloat(match[1]);
  
  // Intentar extraer nombre del remitente
  const namePatterns = [
    /de\s+([a-záéíóúñ\s]+?)(?:\s+via|\s+con|\s+desde|\.|$)/i,
    /([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+?)\s+te\s+(?:envió|envio|transfirió|transfirio|pago|pagó)/i,
    /recibiste.*?de\s+([^\n]+)/i,
  ];
  
  let sender = 'Desconocido';
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch) {
      sender = nameMatch[1].trim();
      break;
    }
  }
  
  return {
    amount,
    sender,
    source: 'other',
    currency: null // Se asignará según país
  };
}

/**
 * Validar resultado del parser
 */
function validate(parsed) {
  if (!parsed) return false;
  
  if (!parsed.amount || isNaN(parsed.amount) || parsed.amount <= 0) {
    return false;
  }
  
  if (!parsed.source) {
    return false;
  }
  
  return true;
}

module.exports = {
  parse,
  validate,
  isOutgoingPayment,
  isSpam,
  hasValidAmount,
  // Exportar parsers específicos para testing
  peruParser,
  boliviaParser
};
