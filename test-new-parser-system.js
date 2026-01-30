// test-new-parser-system.js
// Test del nuevo sistema de parsers multi-país

const parser = require('./src/services/parsers');
const { getAllCountries, getCountriesWithParser } = require('./src/config/countries');

console.log('🌎 SISTEMA DE PARSERS MULTI-PAÍS\n');
console.log('='.repeat(60));

// Mostrar países configurados
const allCountries = getAllCountries();
console.log(`\n📋 Países configurados: ${allCountries.length}`);
console.log('\n🌍 LATINOAMÉRICA + ESPAÑA:');
allCountries.forEach(country => {
  const status = country.hasParser ? '✅' : '⏳';
  console.log(`   ${status} ${country.flag} ${country.name} (${country.code}) - ${country.currencySymbol}`);
});

// Mostrar países con parser implementado
const withParser = getCountriesWithParser();
console.log(`\n✅ Países con parser implementado: ${withParser.length}`);
withParser.forEach(country => {
  console.log(`   ${country.flag} ${country.name} (${country.code}) - v${country.parserVersion}`);
});

// Tests por país
console.log('\n' + '='.repeat(60));
console.log('\n🧪 PRUEBAS POR PAÍS\n');

const testCases = [
  {
    country: 'PE',
    name: 'Perú - Yape',
    text: 'Yape! JUAN PEREZ te envió un pago por S/ 50.00',
    expectedAmount: 50.00,
    expectedSender: 'JUAN PEREZ',
    expectedCurrency: 'PEN'
  },
  {
    country: 'PE',
    name: 'Perú - Plin',
    text: 'Carlos Mendoza te ha plineado S/ 100.00',
    expectedAmount: 100.00,
    expectedCurrency: 'PEN'
  },
  {
    country: 'BO',
    name: 'Bolivia - Yape',
    text: 'QR DE CHOQUE ORTIZ JUAN GABRIEL te envió Bs. 0.30',
    expectedAmount: 0.30,
    expectedSender: 'CHOQUE ORTIZ JUAN GABRIEL',
    expectedCurrency: 'BOB'
  },
  {
    country: 'BO',
    name: 'Bolivia - Formato corto',
    text: 'MARIA LOPEZ te envió Bs. 15.50',
    expectedAmount: 15.50,
    expectedCurrency: 'BOB'
  },
  {
    country: 'PE',
    name: 'Perú - Oferta (rechazar)',
    text: 'Papa Johns - Pizza grande a S/ 25.90. ¡Pide ahora!',
    shouldReject: true
  },
  {
    country: 'BO',
    name: 'Bolivia - Pago saliente (rechazar)',
    text: 'Enviaste Bs. 20.00 a Juan Pérez',
    shouldReject: true
  },
  // Países sin parser (usar genérico)
  {
    country: 'AR',
    name: 'Argentina - Mercado Pago',
    text: 'Recibiste $ 500 de Juan Rodriguez',
    expectedAmount: 500,
    expectedCurrency: 'ARS'
  },
  {
    country: 'MX',
    name: 'México - Genérico',
    text: 'Carlos Lopez te envió $ 250',
    expectedAmount: 250,
    expectedCurrency: 'MXN'
  },
  {
    country: 'ES',
    name: 'España - Bizum',
    text: 'Recibiste € 50 de María García',
    expectedAmount: 50,
    expectedCurrency: 'EUR'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log('─'.repeat(60));
  console.log(`   País: ${testCase.country}`);
  console.log(`   Texto: "${testCase.text.substring(0, 60)}${testCase.text.length > 60 ? '...' : ''}"`);
  
  const result = parser.parse(testCase.text, testCase.country);
  
  if (testCase.shouldReject) {
    if (result === null) {
      console.log('   ✅ PASÓ - Correctamente rechazado\n');
      passed++;
    } else {
      console.log('   ❌ FALLÓ - No se rechazó correctamente\n');
      failed++;
    }
  } else {
    if (!result) {
      console.log('   ❌ FALLÓ - Se rechazó un pago válido\n');
      failed++;
    } else {
      const amountMatch = Math.abs(result.amount - testCase.expectedAmount) < 0.01;
      const currencyMatch = !testCase.expectedCurrency || result.currency === testCase.expectedCurrency;
      const senderMatch = !testCase.expectedSender || 
                         result.sender.toUpperCase().includes(testCase.expectedSender.toUpperCase());
      
      if (amountMatch && currencyMatch && senderMatch) {
        console.log(`   ✅ PASÓ`);
        console.log(`      Monto: ${result.amount} (${result.currency || 'N/A'})`);
        console.log(`      Remitente: ${result.sender}`);
        console.log(`      Fuente: ${result.source}\n`);
        passed++;
      } else {
        console.log(`   ❌ FALLÓ - Datos incorrectos`);
        console.log(`      Esperado: ${testCase.expectedAmount} ${testCase.expectedCurrency}`);
        console.log(`      Obtenido: ${result.amount} ${result.currency}\n`);
        failed++;
      }
    }
  }
});

console.log('='.repeat(60));
console.log('\n📊 RESUMEN:');
console.log(`   ✅ Pasaron: ${passed}/${testCases.length}`);
console.log(`   ❌ Fallaron: ${failed}/${testCases.length}`);
console.log(`   📈 Tasa de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 ¡Sistema de parsers multi-país funcionando correctamente!\n');
  console.log('📝 Próximos pasos:');
  console.log('   1. Implementar parsers específicos para más países');
  console.log('   2. Agregar selector de país en la app Flutter');
  console.log('   3. Actualizar controladores para usar país del usuario');
  console.log('   4. Migrar código existente al nuevo sistema\n');
} else {
  console.log('\n⚠️  Algunos tests fallaron. Revisa los detalles arriba.\n');
  process.exit(1);
}
