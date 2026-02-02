const https = require('https');

const data = JSON.stringify({
  email: `hacker_test_${Date.now()}@test.com`,
  password: 'Test1234',
  full_name: 'Hacker Test',
  phone: '+51999888777',
  role: 'super_admin'
});

const options = {
  hostname: 'yapeprobackend-production-up.railway.app',
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(data);
req.end();
