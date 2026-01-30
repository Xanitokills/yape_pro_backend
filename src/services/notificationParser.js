// src/services/notificationParser.js
/**
 * DEPRECADO: Este archivo se mantiene por compatibilidad
 * El nuevo sistema de parsers está en: src/services/parsers/
 * 
 * Para nuevos desarrollos, usar:
 * const parser = require('./parsers');
 * const result = parser.parse(text, country);
 */

// Importar nuevo sistema de parsers
const newParser = require('./parsers');

/**
 * Parsear notificaciones de Yape, Plin, BCP
 * Extrae: monto, nombre del remitente, fuente
 * 
 * @deprecated Usar newParser.parse(text, country) en su lugar
 */

/**
 * Parsear notificación de Yape
 * Ejemplo Perú: "Confirmación de Pago Yape! SANDRO ANTHONIONY SAAVEDRA CASTRO te envió un pago por S/ 1"
 * Ejemplo Bolivia: "QR DE CHOQUE ORTIZ JUAN GABRIEL te envió Bs. 0.30"
 */
function parseYape(text) {
  // Patrones comunes de Yape
  const patterns = [
    // Formato Bolivia: "QR DE NOMBRE te envió Bs. MONTO"
    /qr\s+de\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/i,
    // Formato Bolivia sin QR: "NOMBRE te envió Bs. MONTO"
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/im,
    // Formato Bolivia con yapeo: "yapeo NOMBRE te envió Bs. MONTO"
    /yapeo\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/i,
    // Nuevo formato Perú: "NOMBRE te envió un pago por S/ MONTO"
    /yape!\s+([^!]+?)\s+te\s+envió\s+un\s+pago\s+por\s+s\/?\s*(\d+(?:\.\d{2})?)/i,
    // Formato antiguo Perú: "Recibiste S/ MONTO de NOMBRE"
    /recibiste\s+s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+via\s+yape|\.|$)/i,
    // Formato Bolivia alternativo: "Recibiste Bs. MONTO de NOMBRE"
    /recibiste\s+bs\.?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+via\s+yape|\.|$)/i,
    /yape.*?s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+)/i,
    /(\d+(?:\.\d{2})?)\s+soles.*?de\s+([^\n]+)/i
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = text.match(pattern);
    if (match) {
      // Para formatos donde nombre viene primero: índice 0, 1, 2, 3
      // Bolivia (0, 1, 2): "QR DE NOMBRE te envió Bs. MONTO", "NOMBRE te envió Bs. MONTO", "yapeo NOMBRE..."
      // Perú (3): "NOMBRE te envió un pago por S/ MONTO"
      if (i <= 3) {
        return {
          amount: parseFloat(match[2]),
          sender: match[1].trim(),
          source: 'yape'
        };
      }
      // Para formatos donde monto viene primero: índice 3, 4, 5, 6
      return {
        amount: parseFloat(match[1]),
        sender: match[2].trim(),
        source: 'yape'
      };
    }
  }
  
  return null;
}

/**
 * Parsear notificación de Plin
 * Ejemplo: "Recibiste S/ 30.50 de Maria Lopez con Plin"
 */
function parsePlin(text) {
  const patterns = [
    /recibiste\s+s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+con\s+plin)?/i,
    /plin.*?s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        amount: parseFloat(match[1]),
        sender: match[2].trim(),
        source: 'plin'
      };
    }
  }
  
  return null;
}

/**
 * Parsear notificación de BCP
 * Ejemplo: "BCP: Abono de S/ 100.00 de cuenta ****1234"
 */
function parseBCP(text) {
  const patterns = [
    /bcp.*?abono.*?s\/?\s*(\d+(?:\.\d{2})?)/i,
    /transferencia.*?recibida.*?s\/?\s*(\d+(?:\.\d{2})?)/i,
    /deposito.*?s\/?\s*(\d+(?:\.\d{2})?)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Intentar extraer número de cuenta o nombre
      const senderMatch = text.match(/de\s+([^\n]+)/i);
      
      return {
        amount: parseFloat(match[1]),
        sender: senderMatch ? senderMatch[1].trim() : 'BCP',
        source: 'bcp'
      };
    }
  }
  
  return null;
}

/**
 * Intentar detectar cualquier monto en el texto
 */
function parseGeneric(text) {
  // Buscar patrones generales de montos (S/ para Perú, Bs. para Bolivia)
  const amountPattern = /(s\/|bs\.)\s*(\d+(?:\.\d{2})?)/i;
  const match = text.match(amountPattern);
  
  if (!match) {
    return null;
  }
  
  const amount = parseFloat(match[2]);
  
  // Intentar extraer nombre
  const namePatterns = [
    /de\s+([a-záéíóúñ\s]+?)(?:\s+via|\s+con|\s+desde|$)/i,
    /remitente:?\s+([^\n]+)/i
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
    source: 'other'
  };
}

/**
 * Parser principal - intenta todos los formatos
 */
function parse(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  // Normalizar texto
  const normalizedText = text.toLowerCase().trim();
  
  // 🚫 FILTRO 1: RECHAZAR PAGOS SALIENTES (que TÚ enviaste)
  const outgoingPatterns = [
    /enviaste\s+(?:s\/|bs\.)/i,
    /le\s+(yapeaste|yapeast)\s+(?:s\/|bs\.)/i,
    /pagaste\s+(?:s\/|bs\.)/i,
    /le\s+(plineaste|plineast)\s+(?:s\/|bs\.)/i,
    /transferiste\s+(?:s\/|bs\.)/i,
    /enviaste\s+un\s+pago/i,
    /hiciste\s+un\s+pago/i,
    /realizaste\s+un\s+pago/i
  ];
  
  // Verificar si es un pago saliente
  for (const pattern of outgoingPatterns) {
    if (pattern.test(normalizedText)) {
      console.log('🚫 PAGO SALIENTE DETECTADO - NO SE PROCESARÁ');
      console.log('   Este es un pago que TÚ enviaste, no uno que recibiste');
      return null;
    }
  }
  
  // 🚫 FILTRO 2: RECHAZAR PROMOCIONES Y SPAM
  const spamPatterns = [
    // Palabras de marketing
    /aprovecha/i,
    /descuento/i,
    /promoción|promocion/i,
    /oferta/i,
    /gana\s+(hasta|un|dinero|puntos)/i,
    /sorteo/i,
    /premio/i,
    // Ofertas de productos (palabras clave antes del monto)
    /productos?\s+(?:desde|a|por|hasta)/i,
    /compra\s+(?:ahora|ya|con)/i,
    /pide\s+(?:ahora|ya)/i,
    /paga\s+con\s+yape/i,
    /tiene\s+productos?/i,
    /zapatillas?\s+desde/i,
    /combo\s+a\s+s\//i,
    /pizza\s+(?:grande|mediana|familiar)\s+a\s+s\//i,
    /desde\s+s\/.*hasta\s+s\//i,
    // Rangos de precios ("desde S/" o "hasta S/")
    /desde\s+(?:s\/|bs\.)/i,
    /hasta\s+(?:s\/|bs\.)/i,
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
    /nuevo.*en\s+yape/i,
    /activa/i,
    /configura/i,
    /completa\s+tu\s+perfil/i,
    /verifica\s+tu/i,
    /confirma\s+tu/i
  ];
  
  // Verificar si es spam/promoción
  for (const pattern of spamPatterns) {
    if (pattern.test(normalizedText)) {
      console.log('🚫 SPAM/PROMOCIÓN DETECTADO - NO SE PROCESARÁ');
      console.log('   Esta es una notificación promocional, no un pago real');
      return null;
    }
  }
  
  // 🚫 FILTRO 3: VERIFICAR QUE CONTENGA UN MONTO (S/ para Perú, Bs. para Bolivia)
  if (!/(?:s\/|bs\.)\s*\d/i.test(normalizedText)) {
    console.log('🚫 NO CONTIENE MONTO - NO SE PROCESARÁ');
    console.log('   La notificación no tiene un monto válido (S/ XX o Bs. XX)');
    return null;
  }
  
  console.log('✅ Notificación validada - es un pago entrante real');
  
  // Intentar parsers específicos primero (usar texto original, no normalizado)
  if (normalizedText.includes('yape') || normalizedText.includes('bs.') || normalizedText.includes('yapeo')) {
    const result = parseYape(text); // Usar texto original
    if (result) return result;
  }
  
  if (normalizedText.includes('plin')) {
    const result = parsePlin(text); // Usar texto original
    if (result) return result;
  }
  
  if (normalizedText.includes('bcp') || normalizedText.includes('banco de credito')) {
    const result = parseBCP(text); // Usar texto original
    if (result) return result;
  }
  
  // Si ninguno funciona, intentar parser genérico
  return parseGeneric(text); // Usar texto original
}

/**
 * Validar que los datos parseados sean correctos
 */
function validate(parsed) {
  if (!parsed) return false;
  
  if (!parsed.amount || isNaN(parsed.amount) || parsed.amount <= 0) {
    return false;
  }
  
  if (!parsed.source || !['yape', 'plin', 'bcp', 'other'].includes(parsed.source)) {
    return false;
  }
  
  return true;
}

/**
 * Ejemplos de prueba
 */
function getExamples() {
  return [
    {
      text: 'Recibiste S/ 50.00 de Juan Perez via Yape',
      expected: { amount: 50.00, sender: 'Juan Perez', source: 'yape' }
    },
    {
      text: 'Recibiste S/ 30.50 de Maria Lopez con Plin',
      expected: { amount: 30.50, sender: 'Maria Lopez', source: 'plin' }
    },
    {
      text: 'BCP: Abono de S/ 100.00 de cuenta ****1234',
      expected: { amount: 100.00, sender: 'cuenta ****1234', source: 'bcp' }
    }
  ];
}

module.exports = {
  parse,
  validate,
  parseYape,
  parsePlin,
  parseBCP,
  parseGeneric,
  getExamples,
  // Exportar nuevo sistema para migración gradual
  newParser
};
