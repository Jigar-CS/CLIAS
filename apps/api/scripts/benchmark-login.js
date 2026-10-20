const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

async function testLogin(email, password) {
  const start = Date.now();
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
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const duration = Date.now() - start;
          let parsed = {};
          try {
            parsed = JSON.parse(body);
          } catch {}
          resolve({ status: res.statusCode, duration, email, data: parsed });
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testGet(path, token) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:4000/api/v1${path}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const duration = Date.now() - start;
          resolve({ status: res.statusCode, duration, path });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const facultyUsers = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    select: { email: true, status: true },
  });
  console.log('Faculty users in DB:', facultyUsers);

  // Test Student login & dashboard endpoints
  console.log('\n--- Testing Student Login & Dashboard Endpoints ---');
  const studentRes = await testLogin('student@charusat.edu.in', 'rahul@2006');
  console.log(`Student Login: ${studentRes.status} in ${studentRes.duration}ms`);
  if (studentRes.data.accessToken) {
    const token = studentRes.data.accessToken;
    // Student dashboard endpoints:
    const endpoints = [
      '/auth/me',
      '/analytics/student/dashboard/summary',
      '/analytics/student/radar/me',
      '/analytics/student/curriculum-progress/me',
      '/analytics/student/readiness/me',
      '/assessments/student/upcoming',
    ];
    for (const ep of endpoints) {
      try {
        const epRes = await testGet(ep, token);
        console.log(`  GET ${ep} -> ${epRes.status} in ${epRes.duration}ms`);
      } catch (err) {
        console.log(`  GET ${ep} -> ERROR: ${err.message}`);
      }
    }
  }

  // Test Faculty Login & Dashboard Endpoints
  const facultyEmail = facultyUsers[0]?.email || 'faculty1.cspit.cse@charusat.edu.in';
  console.log(`\n--- Testing Faculty (${facultyEmail}) Login & Dashboard Endpoints ---`);
  const facRes = await testLogin(facultyEmail, 'clias123');
  console.log(`Faculty Login: ${facRes.status} in ${facRes.duration}ms`);
  if (facRes.data.accessToken) {
    const token = facRes.data.accessToken;
    const endpoints = [
      '/auth/me',
      '/analytics/faculty/overview',
      '/analytics/cohort/analytics',
      '/analytics/at-risk/alerts',
      '/assessments',
    ];
    for (const ep of endpoints) {
      try {
        const epRes = await testGet(ep, token);
        console.log(`  GET ${ep} -> ${epRes.status} in ${epRes.duration}ms`);
      } catch (err) {
        console.log(`  GET ${ep} -> ERROR: ${err.message}`);
      }
    }
  }

  // Test HOD Login & Dashboard Endpoints
  console.log(`\n--- Testing HOD Login & Dashboard Endpoints ---`);
  const hodRes = await testLogin('hod@charusat.edu.in', 'clias123');
  console.log(`HOD Login: ${hodRes.status} in ${hodRes.duration}ms`);
  if (hodRes.data.accessToken) {
    const token = hodRes.data.accessToken;
    const endpoints = [
      '/auth/me',
      '/analytics/hod/curriculum-health/me',
      '/analytics/hod/department-overview',
    ];
    for (const ep of endpoints) {
      try {
        const epRes = await testGet(ep, token);
        console.log(`  GET ${ep} -> ${epRes.status} in ${epRes.duration}ms`);
      } catch (err) {
        console.log(`  GET ${ep} -> ERROR: ${err.message}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
