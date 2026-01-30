// src/services/parsers/boliviaParser.js
/**
 * Parser específico para Bolivia
 * Soporta: Yape Bolivia, Tigo Money, BCP Bolivia
 */

/**
 * Parsear notificación de Yape Bolivia
 */
function parseYape(text) {
  const patterns = [
    // Formato Bolivia: "QR DE NOMBRE te envió Bs. MONTO"
    /qr\s+de\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/i,
    // Formato sin QR: "NOMBRE te envió Bs. MONTO"
    /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/im,
    // Con "yapeo": "yapeo NOMBRE te envió Bs. MONTO"
    /yapeo\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)\s+te\s+envió\s+bs\.?\s*(\d+(?:\.\d{2})?)/i,
    // Formato alternativo: "Recibiste Bs. MONTO de NOMBRE"
    /recibiste\s+bs\.?\s*(\d+(?:\.\d{2})?)\s+de\s+([^\n]+?)(?:\s+via\s+yape|\.|$)/i,
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match) {
      if (i <= 2) {
        // Nombre primero
        return {
          amount: parseFloat(match[2]),
          sender: match[1].trim(),
          source: 'yape',
          currency: 'BOB'
        };
      } else {
        // Monto primero
        return {
          amount: parseFloat(match[1]),
          sender: match[2].trim(),
          source: 'yape',
          currency: 'BOB'
        };
      }
    }
  }
  
  return null;
}

/**
 * Parsear notificación de Tigo Money
 */
function parseTigoMoney(text) {
  const patterns = [
    /tigo\s+money.*?bs\.?\s*(\d+(?:\.\d{2})?)/i,
    /recibiste\s+bs\.?\s*(\d+(?:\.\d{2})?)\s+.*?tigo/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const senderMatch = text.match(/de\s+([^\n]+)/i);
      
      return {
        amount: parseFloat(match[1]),
        sender: senderMatch ? senderMatch[1].trim() : 'Tigo Money',
        source: 'tigo_money',
        currency: 'BOB'
      };
    }
  }
  
  return null;
}

/**
 * Parser principal para Bolivia
 */
function parse(text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Intentar parsers específicos
  if (normalizedText.includes('yape') || normalizedText.includes('yapeo') || normalizedText.includes('qr de')) {
    const result = parseYape(text);
    if (result) return result;
  }
  
  if (normalizedText.includes('tigo')) {
    const result = parseTigoMoney(text);
    if (result) return result;
  }
  
  // Parser genérico para otros servicios
  const amountPattern = /bs\.\s*(\d+(?:\.\d{2})?)/i;
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
      currency: 'BOB'
    };
  }
  
  return null;
}

module.exports = {
  parse,
  parseYape,
  parseTigoMoney
};
