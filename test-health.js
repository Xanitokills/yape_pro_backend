const https = require('https');

https.get('https://yapeprobackend-production-up.railway.app/health', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
