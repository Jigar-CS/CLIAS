const http = require('http');

async function testLogin(email, password) {
  const payload = JSON.stringify({ email, password });
  return new Promise((resolve, reject) => {
    const req = http.request(
      'http://localhost:4000/api/v1/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testEndpoint(path, token) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:4000/api/v1${path}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({ status: res.statusCode, duration: Date.now() - start });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const loginRes = await testLogin('student@charusat.edu.in', 'rahul@2006');
  const token = loginRes.accessToken;

  const endpoints = [
    '/auth/me',
    '/analytics/student/me/summary',
    '/disputes/notifications',
    '/assessments/student',
    '/analytics/student/me/learning-curve',
  ];

  for (const ep of endpoints) {
    const res = await testEndpoint(ep, token);
    console.log(`GET ${ep} -> ${res.status} in ${res.duration}ms`);
  }
}

main().catch(console.error);
