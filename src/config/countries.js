// src/config/countries.js
/**
 * Configuración de países soportados en Yape Pro
 * Latinoamérica + España
 */

const COUNTRIES = {
  // SUDAMÉRICA
  PE: {
    name: 'Perú',
    flag: '🇵🇪',
    currency: 'PEN',
    currencySymbol: 'S/',
    phoneCode: '+51',
    phoneDigits: 9,
    timezone: 'America/Lima',
    paymentApps: ['yape', 'plin', 'bcp', 'bbva', 'interbank'],
    hasParser: true, // Parser específico implementado
    parserVersion: '2.0'
  },
  BO: {
    name: 'Bolivia',
    flag: '🇧🇴',
    currency: 'BOB',
    currencySymbol: 'Bs.',
    phoneCode: '+591',
    phoneDigits: 8,
    timezone: 'America/La_Paz',
    paymentApps: ['yape_bolivia', 'tigo_money', 'bcp_bolivia'],
    hasParser: true,
    parserVersion: '2.0'
  },
  AR: {
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencySymbol: '$',
    phoneCode: '+54',
    phoneDigits: 10,
    timezone: 'America/Argentina/Buenos_Aires',
    paymentApps: ['mercadopago', 'uala', 'brubank', 'modo'],
    hasParser: false, // Por implementar
    parserVersion: '1.0'
  },
  BR: {
    name: 'Brasil',
    flag: '🇧🇷',
    currency: 'BRL',
    currencySymbol: 'R$',
    phoneCode: '+55',
    phoneDigits: 11,
    timezone: 'America/Sao_Paulo',
    paymentApps: ['pix', 'picpay', 'mercadopago', 'nubank'],
    hasParser: false,
    parserVersion: '1.0'
  },
  CL: {
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    currencySymbol: '$',
    phoneCode: '+56',
    phoneDigits: 9,
    timezone: 'America/Santiago',
    paymentApps: ['mach', 'mercadopago', 'tenpo', 'bci'],
    hasParser: false,
    parserVersion: '1.0'
  },
  CO: {
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencySymbol: '$',
    phoneCode: '+57',
    phoneDigits: 10,
    timezone: 'America/Bogota',
    paymentApps: ['nequi', 'daviplata', 'bancolombia', 'movii'],
    hasParser: false,
    parserVersion: '1.0'
  },
  EC: {
    name: 'Ecuador',
    flag: '🇪🇨',
    currency: 'USD',
    currencySymbol: '$',
    phoneCode: '+593',
    phoneDigits: 9,
    timezone: 'America/Guayaquil',
    paymentApps: ['banco_pichincha', 'banco_guayaquil', 'produbanco'],
    hasParser: false,
    parserVersion: '1.0'
  },
  PY: {
    name: 'Paraguay',
    flag: '🇵🇾',
    currency: 'PYG',
    currencySymbol: '₲',
    phoneCode: '+595',
    phoneDigits: 9,
    timezone: 'America/Asuncion',
    paymentApps: ['tigo_money', 'personal_pay', 'zimple'],
    hasParser: false,
    parserVersion: '1.0'
  },
  UY: {
    name: 'Uruguay',
    flag: '🇺🇾',
    currency: 'UYU',
    currencySymbol: '$',
    phoneCode: '+598',
    phoneDigits: 8,
    timezone: 'America/Montevideo',
    paymentApps: ['prex', 'mercadopago', 'midinero'],
    hasParser: false,
    parserVersion: '1.0'
  },
  VE: {
    name: 'Venezuela',
    flag: '🇻🇪',
    currency: 'VES',
    currencySymbol: 'Bs.',
    phoneCode: '+58',
    phoneDigits: 10,
    timezone: 'America/Caracas',
    paymentApps: ['pago_movil', 'banesco', 'mercantil'],
    hasParser: false,
    parserVersion: '1.0'
  },

  // CENTROAMÉRICA
  MX: {
    name: 'México',
    flag: '🇲🇽',
    currency: 'MXN',
    currencySymbol: '$',
    phoneCode: '+52',
    phoneDigits: 10,
    timezone: 'America/Mexico_City',
    paymentApps: ['mercadopago', 'clip', 'rappi_pay', 'bbva'],
    hasParser: false,
    parserVersion: '1.0'
  },
  GT: {
    name: 'Guatemala',
    flag: '🇬🇹',
    currency: 'GTQ',
    currencySymbol: 'Q',
    phoneCode: '+502',
    phoneDigits: 8,
    timezone: 'America/Guatemala',
    paymentApps: ['banco_industrial', 'bantrab'],
    hasParser: false,
    parserVersion: '1.0'
  },
  HN: {
    name: 'Honduras',
    flag: '🇭🇳',
    currency: 'HNL',
    currencySymbol: 'L',
    phoneCode: '+504',
    phoneDigits: 8,
    timezone: 'America/Tegucigalpa',
    paymentApps: ['tigo_money', 'banco_atlantida'],
    hasParser: false,
    parserVersion: '1.0'
  },
  SV: {
    name: 'El Salvador',
    flag: '🇸🇻',
    currency: 'USD',
    currencySymbol: '$',
    phoneCode: '+503',
    phoneDigits: 8,
    timezone: 'America/El_Salvador',
    paymentApps: ['tigo_money', 'banco_agricola', 'chivo'],
    hasParser: false,
    parserVersion: '1.0'
  },
  NI: {
    name: 'Nicaragua',
    flag: '🇳🇮',
    currency: 'NIO',
    currencySymbol: 'C$',
    phoneCode: '+505',
    phoneDigits: 8,
    timezone: 'America/Managua',
    paymentApps: ['bac', 'banpro'],
    hasParser: false,
    parserVersion: '1.0'
  },
  CR: {
    name: 'Costa Rica',
    flag: '🇨🇷',
    currency: 'CRC',
    currencySymbol: '₡',
    phoneCode: '+506',
    phoneDigits: 8,
    timezone: 'America/Costa_Rica',
    paymentApps: ['sinpe_movil', 'bac', 'banco_nacional'],
    hasParser: false,
    parserVersion: '1.0'
  },
  PA: {
    name: 'Panamá',
    flag: '🇵🇦',
    currency: 'PAB',
    currencySymbol: 'B/.',
    phoneCode: '+507',
    phoneDigits: 8,
    timezone: 'America/Panama',
    paymentApps: ['yappy', 'nequi_panama', 'banco_general'],
    hasParser: false,
    parserVersion: '1.0'
  },
  CU: {
    name: 'Cuba',
    flag: '🇨🇺',
    currency: 'CUP',
    currencySymbol: '$',
    phoneCode: '+53',
    phoneDigits: 8,
    timezone: 'America/Havana',
    paymentApps: ['transfermovil', 'enzona'],
    hasParser: false,
    parserVersion: '1.0'
  },
  DO: {
    name: 'República Dominicana',
    flag: '🇩🇴',
    currency: 'DOP',
    currencySymbol: 'RD$',
    phoneCode: '+1-809',
    phoneDigits: 10,
    timezone: 'America/Santo_Domingo',
    paymentApps: ['banco_popular', 'banreservas'],
    hasParser: false,
    parserVersion: '1.0'
  },

  // EUROPA
  ES: {
    name: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    phoneCode: '+34',
    phoneDigits: 9,
    timezone: 'Europe/Madrid',
    paymentApps: ['bizum', 'bbva', 'santander', 'caixabank'],
    hasParser: false,
    parserVersion: '1.0'
  },

  // NORTEAMÉRICA
  US: {
    name: 'Estados Unidos',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    phoneCode: '+1',
    phoneDigits: 10,
    timezone: 'America/New_York',
    paymentApps: ['zelle', 'venmo', 'cash_app', 'apple_pay', 'paypal'],
    hasParser: false,
    parserVersion: '1.0'
  }
};

/**
 * Obtener configuración de un país
 */
function getCountry(code) {
  return COUNTRIES[code.toUpperCase()] || null;
}

/**
 * Obtener lista de todos los países
 */
function getAllCountries() {
  return Object.entries(COUNTRIES).map(([code, data]) => ({
    code,
    ...data
  }));
}

/**
 * Obtener países con parser implementado
 */
function getCountriesWithParser() {
  return Object.entries(COUNTRIES)
    .filter(([_, data]) => data.hasParser)
    .map(([code, data]) => ({ code, ...data }));
}

/**
 * Detectar país desde código telefónico
 */
function detectCountryFromPhone(phone) {
  // Limpiar teléfono
  const cleaned = phone.replace(/\D/g, '');
  
  // Buscar coincidencia
  for (const [code, data] of Object.entries(COUNTRIES)) {
    const phoneCode = data.phoneCode.replace(/\D/g, '');
    if (cleaned.startsWith(phoneCode)) {
      return code;
    }
  }
  
  return null;
}

/**
 * Validar formato de teléfono según país
 */
function validatePhone(phone, countryCode) {
  const country = getCountry(countryCode);
  if (!country) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  const phoneCode = country.phoneCode.replace(/\D/g, '');
  
  // Verificar que empiece con el código correcto
  if (!cleaned.startsWith(phoneCode)) return false;
  
  // Verificar longitud (código + dígitos)
  const expectedLength = phoneCode.length + country.phoneDigits;
  return cleaned.length === expectedLength;
}

/**
 * Formatear teléfono según país
 */
function formatPhone(phone, countryCode) {
  const country = getCountry(countryCode);
  if (!country) return phone;
  
  const cleaned = phone.replace(/\D/g, '');
  const phoneCode = country.phoneCode.replace(/\D/g, '');
  
  if (cleaned.startsWith(phoneCode)) {
    const number = cleaned.substring(phoneCode.length);
    return `${country.phoneCode} ${number}`;
  }
  
  return phone;
}

/**
 * Obtener símbolo de moneda para mostrar en UI
 */
function getCurrencySymbol(countryCode) {
  const country = getCountry(countryCode);
  return country ? country.currencySymbol : 'S/';
}

/**
 * Verificar si un país tiene parser implementado
 */
function hasParser(countryCode) {
  const country = getCountry(countryCode);
  return country ? country.hasParser : false;
}

module.exports = {
  COUNTRIES,
  getCountry,
  getAllCountries,
  getCountriesWithParser,
  detectCountryFromPhone,
  validatePhone,
  formatPhone,
  getCurrencySymbol,
  hasParser
};
