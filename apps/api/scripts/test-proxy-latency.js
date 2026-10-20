const http = require('http');

async function testFetch(url) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ duration: Date.now() - start, status: res.statusCode }));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Testing direct NestJS (port 4000):');
  const d1 = await testFetch('http://127.0.0.1:4000/api/v1/courses');
  console.log(`Direct 127.0.0.1:4000 -> ${d1.status} in ${d1.duration}ms`);

  const d2 = await testFetch('http://localhost:4000/api/v1/courses');
  console.log(`Direct localhost:4000 -> ${d2.status} in ${d2.duration}ms`);

  console.log('\nTesting Next.js proxy (port 3000):');
  try {
    const p1 = await testFetch('http://127.0.0.1:3000/api/v1/courses');
    console.log(`Next.js proxy 127.0.0.1:3000 -> ${p1.status} in ${p1.duration}ms`);
  } catch (e) {
    console.log('Next.js proxy error:', e.message);
  }
}

main().catch(console.error);
