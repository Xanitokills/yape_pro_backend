// src/services/parsers/peruParser.js
/**
 * Parser específico para Perú
 * Soporta: Yape, Plin, BCP, BBVA, Interbank
 */

/**
 * Parsear notificación de Yape Perú
 */
function parseYape(text) {
  const patterns = [
    // Formato actual: "Yape! NOMBRE te envió un pago por S/ MONTO"
    /yape!\s+([^!]+?)\s+te\s+envió\s+un\s+pago\s+por\s+s\/?\s*(\d+(?:\.\d{2})?)/i,
    // Formato corto: "NOMBRE te envió S/ MONTO"
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+s\/?\s*(\d+(?:\.\d{2})?)/im,
    // Formato antiguo: "Recibiste S/ MONTO de NOMBRE"
    /recibiste\s+s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+via\s+yape|\.|$)/i,
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match) {
      if (i <= 1) {
        // Nombre primero
        return {
          amount: parseFloat(match[2]),
          sender: match[1].trim(),
          source: 'yape',
          currency: 'PEN'
        };
      } else {
        // Monto primero
        return {
          amount: parseFloat(match[1]),
          sender: match[2].trim(),
          source: 'yape',
          currency: 'PEN'
        };
      }
    }
  }
  
  return null;
}

/**
 * Parsear notificación de Plin
 */
function parsePlin(text) {
  const patterns = [
    // "NOMBRE te ha plineado S/ MONTO"
    /(.+?)\s+te\s+ha\s+plineado\s+s\/?\s*(\d+(?:\.\d{2})?)/i,
    // "NOMBRE te plineó S/ MONTO"
    /(.+?)\s+te\s+plineó\s+s\/?\s*(\d+(?:\.\d{2})?)/i,
    // "Recibiste S/ MONTO de NOMBRE con Plin"
    /recibiste\s+s\/?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+con\s+plin)?/i,
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match) {
      if (i <= 1) {
        return {
          amount: parseFloat(match[2]),
          sender: match[1].trim().replace(/interbank/i, '').trim(),
          source: 'plin',
          currency: 'PEN'
        };
      } else {
        return {
          amount: parseFloat(match[1]),
          sender: match[2].trim(),
          source: 'plin',
          currency: 'PEN'
        };
      }
    }
  }
  
  return null;
}

/**
 * Parsear notificación de BCP
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
      const senderMatch = text.match(/de\s+([^\n]+)/i);
      
      return {
        amount: parseFloat(match[1]),
        sender: senderMatch ? senderMatch[1].trim() : 'BCP',
        source: 'bcp',
        currency: 'PEN'
      };
    }
  }
  
  return null;
}

/**
 * Parser principal para Perú
 */
function parse(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Intentar parsers específicos
  if (normalizedText.includes('yape')) {
    const result = parseYape(text);
    if (result) return result;
  }
  
  if (normalizedText.includes('plin')) {
    const result = parsePlin(text);
    if (result) return result;
  }
  
  if (normalizedText.includes('bcp') || normalizedText.includes('banco de credito')) {
    const result = parseBCP(text);
    if (result) return result;
  }
  
  // Parser genérico para otros bancos
  const amountPattern = /s\/\s*(\d+(?:\.\d{2})?)/i;
  const match = text.match(amountPattern);
  
  if (match) {
    const namePatterns = [
      /de\s+([a-záéíóúñ\s]+?)(?:\s+via|\s+con|\s+desde|\.|$)/i,
      /([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+?)\s+te\s+(?:envió|transfirió)/i,
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
      amount: parseFloat(match[1]),
      sender,
      source: 'other',
      currency: 'PEN'
    };
  }
  
  return null;
}

module.exports = {
  parse,
  parseYape,
  parsePlin,
  parseBCP
};
