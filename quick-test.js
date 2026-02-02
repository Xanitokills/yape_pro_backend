const https = require('https');

https.get('https://yapeprobackend-production-up.railway.app/', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('\nBody:', body);
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
