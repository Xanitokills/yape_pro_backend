// src/services/notificationParser.js

/**
 * Parsear notificaciones de Yape, Plin, BCP
 * Extrae: monto, nombre del remitente, fuente
 */

/**
 * Parsear notificación de Yape
 * Ejemplo: "Confirmación de Pago Yape! SANDRO ANTHONIONY SAAVEDRA CASTRO te envió un pago por S/ 1"
 * Ejemplo: "Recibiste S/ 50.00 de Juan Perez via Yape"
 */
function parseYape(text) {
  // Patrones comunes de Yape
  const patterns = [
    // Nuevo formato: "NOMBRE te envió un pago por S/ MONTO"
    /yape!\s+([^!]+?)\s+te\s+envió\s+un\s+pago\s+por\s+s\/?\s*(\d+(?:\.\d{2})?)/i,
    // Formato antiguo
    /recibiste\s+s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+via\s+yape)?/i,
    /yape.*?s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+)/i,
    /(\d+(?:\.\d{2})?)\s+soles.*?de\s+([^\n]+)/i
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = text.match(pattern);
    if (match) {
      // Para el nuevo formato, nombre y monto están invertidos
      if (i === 0) {
        return {
          amount: parseFloat(match[2]),
          sender: match[1].trim(),
          source: 'yape'
        };
      }
      // Para formatos antiguos
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
  // Buscar patrones generales de montos
  const amountPattern = /s\/?\s*(\d+(?:\.\d{2})?)/i;
  const match = text.match(amountPattern);
  
  if (!match) {
    return null;
  }
  
  const amount = parseFloat(match[1]);
  
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
  
  // Intentar parsers específicos primero
  if (normalizedText.includes('yape')) {
    const result = parseYape(normalizedText);
    if (result) return result;
  }
  
  if (normalizedText.includes('plin')) {
    const result = parsePlin(normalizedText);
    if (result) return result;
  }
  
  if (normalizedText.includes('bcp') || normalizedText.includes('banco de credito')) {
    const result = parseBCP(normalizedText);
    if (result) return result;
  }
  
  // Si ninguno funciona, intentar parser genérico
  return parseGeneric(normalizedText);
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
  getExamples
};
