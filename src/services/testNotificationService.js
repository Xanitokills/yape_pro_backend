/**
 * Servicio de Notificaciones de Prueba
 * Genera notificaciones simuladas por billetera y país para verificar el servicio
 */

const { supabase } = require('../config/database');
const { parse } = require('./parsers/index');
const { getCountry } = require('../config/countries');

// Plantillas de notificaciones de prueba por billetera y país
const TEST_NOTIFICATIONS = {
  PE: {
    YAPE: [
      'Recibiste S/125.50 de Juan Perez. Hora: 14:30',
      'Te yaperon S/89.00 de Maria Lopez',
      'Recibiste S/250.00 de Carlos Rodriguez - Pago pedido #123',
      'Transferencia recibida: S/45.80 de Ana Garcia'
    ],
    PLIN: [
      'Recibiste S/180.00 de Pedro Sanchez',
      'Te plinearon S/95.50 de Laura Martinez',
      'Transferencia exitosa: S/320.00 de Jose Torres',
      'Recibiste S/67.30 de Sofia Ramirez'
    ],
    TUNKI: [
      'Recibiste S/150.00 de Miguel Flores',
      'Te pagaron S/210.50 de Carmen Diaz',
      'Transferencia recibida: S/88.00 de Ricardo Morales'
    ],
    INTERBANK: [
      'Abono a tu cuenta: S/500.00 de EMPRESA SAC',
      'Transferencia recibida: S/1,250.00 de Proveedor XYZ',
      'Deposito: S/380.50 en tu cuenta corriente'
    ],
    BBVA: [
      'Transferencia recibida: S/450.00 de Cliente ABC',
      'Abono: S/890.00 en tu cuenta de ahorros',
      'Deposito exitoso: S/175.25'
    ],
    BCP: [
      'Abono en tu cuenta: S/650.00',
      'Transferencia recibida: S/1,100.00 de Empresa XYZ',
      'Deposito: S/290.50'
    ]
  },
  BO: {
    TIGO_MONEY: [
      'Recibiste Bs 145.00 de Juan Carlos',
      'Te enviaron Bs 98.50 de Maria Elena',
      'Transferencia: Bs 275.00 de Pedro Antonio',
      'Pago recibido: Bs 56.80 de Ana Sofia'
    ],
    BANCO_UNION: [
      'Abono: Bs 520.00 en tu cuenta',
      'Transferencia recibida: Bs 890.00',
      'Deposito exitoso: Bs 340.50'
    ],
    BNB: [
      'Transferencia recibida: Bs 680.00',
      'Abono en cuenta: Bs 1,250.00',
      'Deposito: Bs 425.30'
    ]
  },
  CL: {
    MACH: [
      'Recibiste $12.500 de Juan Silva',
      'Te enviaron $8.900 de Maria Gonzalez',
      'Transferencia: $25.000 de Pedro Castro',
      'Pago recibido: $5.680'
    ],
    MERCADO_PAGO: [
      'Recibiste $18.000 de Cliente A',
      'Pago confirmado: $9.500 de Comprador B',
      'Transferencia: $32.000 de Usuario C'
    ]
  },
  EC: {
    BANCO_PICHINCHA: [
      'Abono: $125.00 en tu cuenta',
      'Transferencia recibida: $89.50',
      'Deposito exitoso: $250.00'
    ],
    BANCO_GUAYAQUIL: [
      'Transferencia: $180.00 a tu cuenta',
      'Abono recibido: $95.50',
      'Pago confirmado: $320.00'
    ]
  },
  CO: {
    NEQUI: [
      'Recibiste $125.000 de Juan Pablo',
      'Te enviaron $89.500 de Maria Camila',
      'Transferencia: $250.000 de Carlos Andres',
      'Pago recibido: $45.800'
    ],
    DAVIPLATA: [
      'Abono: $180.000 en tu cuenta',
      'Transferencia recibida: $95.500',
      'Deposito exitoso: $320.000'
    ],
    BANCOLOMBIA: [
      'Transferencia: $500.000 de Empresa ABC',
      'Abono recibido: $1.250.000',
      'Pago confirmado: $380.500'
    ]
  },
  MX: {
    MERCADO_PAGO: [
      'Recibiste $1,250.00 de Juan Lopez',
      'Te enviaron $890.00 de Maria Fernandez',
      'Transferencia: $2,500.00 de Pedro Hernandez',
      'Pago recibido: $458.00'
    ],
    BBVA_MEXICO: [
      'Abono: $1,800.00 en tu cuenta',
      'Transferencia recibida: $950.00',
      'Deposito exitoso: $3,200.00'
    ]
  },
  AR: {
    MERCADO_PAGO: [
      'Recibiste $12.500 de Juan Martin',
      'Te enviaron $8.900 de Maria Laura',
      'Transferencia: $25.000 de Carlos Alberto',
      'Pago recibido: $4.580'
    ],
    BRUBANK: [
      'Abono: $18.000 en tu cuenta',
      'Transferencia recibida: $9.500',
      'Deposito exitoso: $32.000'
    ]
  }
};

/**
 * Obtener lista de países y billeteras disponibles para pruebas
 */
function getAvailableTestOptions() {
  const options = [];
  
  for (const [country, wallets] of Object.entries(TEST_NOTIFICATIONS)) {
    const countryConfig = getCountry(country);
    const countryName = countryConfig?.name || country;
    
    for (const wallet of Object.keys(wallets)) {
      options.push({
        country,
        countryName,
        wallet,
        notificationCount: wallets[wallet].length
      });
    }
  }
  
  return options;
}

/**
 * Generar notificación de prueba
 */
async function generateTestNotification(country, wallet) {
  try {
    // Verificar que existan notificaciones para ese país y billetera
    if (!TEST_NOTIFICATIONS[country]) {
      return {
        success: false,
        error: `País ${country} no tiene notificaciones de prueba configuradas`
      };
    }
    
    if (!TEST_NOTIFICATIONS[country][wallet]) {
      return {
        success: false,
        error: `Billetera ${wallet} no configurada para ${country}`
      };
    }
    
    // Seleccionar notificación aleatoria
    const notifications = TEST_NOTIFICATIONS[country][wallet];
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    // Parsear la notificación
    const parsedResult = parse(randomNotification, country);
    
    // Obtener configuración del país
    const countryConfig = getCountry(country);
    
    // Verificar patrones activos en la base de datos
    const { data: patterns, error: patternError } = await supabase
      .from('notification_patterns')
      .select('*')
      .eq('country', country)
      .eq('wallet_type', wallet)
      .eq('is_active', true);
    
    return {
      success: true,
      test: {
        country,
        countryName: countryConfig?.name || country,
        wallet,
        rawNotification: randomNotification,
        parsedData: parsedResult,
        hasActivePatterns: patterns && patterns.length > 0,
        patternCount: patterns?.length || 0,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('❌ Error generando notificación de prueba:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ejecutar prueba completa de todas las billeteras de un país
 */
async function testCountry(country) {
  try {
    if (!TEST_NOTIFICATIONS[country]) {
      return {
        success: false,
        error: `País ${country} no configurado`
      };
    }
    
    const results = [];
    const wallets = Object.keys(TEST_NOTIFICATIONS[country]);
    
    for (const wallet of wallets) {
      const result = await generateTestNotification(country, wallet);
      results.push({
        wallet,
        ...result
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return {
      success: true,
      country,
      countryName: getCountry(country)?.name || country,
      totalTests: results.length,
      successCount,
      failureCount,
      results
    };
    
  } catch (error) {
    console.error('❌ Error en prueba de país:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Ejecutar prueba completa de todo el sistema
 */
async function testAllSystem() {
  try {
    const countries = Object.keys(TEST_NOTIFICATIONS);
    const results = [];
    
    for (const country of countries) {
      const countryResult = await testCountry(country);
      results.push(countryResult);
    }
    
    const totalTests = results.reduce((sum, r) => sum + (r.totalTests || 0), 0);
    const totalSuccess = results.reduce((sum, r) => sum + (r.successCount || 0), 0);
    const totalFailures = results.reduce((sum, r) => sum + (r.failureCount || 0), 0);
    
    return {
      success: true,
      summary: {
        totalCountries: countries.length,
        totalTests,
        totalSuccess,
        totalFailures,
        successRate: totalTests > 0 ? ((totalSuccess / totalTests) * 100).toFixed(2) + '%' : '0%'
      },
      results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en prueba completa del sistema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verificar estado de parsers y patrones por país
 */
async function checkSystemStatus() {
  try {
    const countries = Object.keys(TEST_NOTIFICATIONS);
    const status = [];
    
    for (const country of countries) {
      const countryConfig = getCountry(country);
      const wallets = Object.keys(TEST_NOTIFICATIONS[country]);
      
      // Contar patrones activos para este país
      const { data: patterns, error: patternError } = await supabase
        .from('notification_patterns')
        .select('wallet_type, is_active')
        .eq('country', country);
      
      const activePatterns = patterns?.filter(p => p.is_active).length || 0;
      const totalPatterns = patterns?.length || 0;
      
      status.push({
        country,
        countryName: countryConfig?.name || country,
        currency: countryConfig?.currency || 'N/A',
        currencySymbol: countryConfig?.currencySymbol || '',
        walletsConfigured: wallets.length,
        wallets,
        totalPatterns,
        activePatterns,
        hasParser: countryConfig !== null,
        status: activePatterns > 0 ? 'operational' : 'limited'
      });
    }
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      systemStatus: status
    };
    
  } catch (error) {
    console.error('❌ Error verificando estado del sistema:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getAvailableTestOptions,
  generateTestNotification,
  testCountry,
  testAllSystem,
  checkSystemStatus
};
