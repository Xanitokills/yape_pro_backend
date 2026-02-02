const https = require('https');

console.log('Probando endpoints básicos...\n');

// Test 1: Root
https.get('https://yapeprobackend-production-up.railway.app/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('1. GET /');
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Body: ${body.substring(0, 100)}`);
    console.log('');
    
    // Test 2: Health
    https.get('https://yapeprobackend-production-up.railway.app/health', (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('2. GET /health');
        console.log(`   Status: ${res2.statusCode}`);
        console.log(`   Body: ${body2}`);
        console.log('');
        
        // Test 3: API Root
        https.get('https://yapeprobackend-production-up.railway.app/api', (res3) => {
          let body3 = '';
          res3.on('data', chunk => body3 += chunk);
          res3.on('end', () => {
            console.log('3. GET /api');
            console.log(`   Status: ${res3.statusCode}`);
            console.log(`   Body: ${body3.substring(0, 200)}`);
          });
        });
      });
    });
  });
});
