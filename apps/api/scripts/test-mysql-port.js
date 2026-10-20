const mysql = require('mysql2/promise');

async function testPort(port, user = 'root', password = '') {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port,
      user,
      password,
    });
    console.log(`✓ Connected successfully to 127.0.0.1:${port}!`);
    const [dbs] = await conn.query('SHOW DATABASES');
    console.log(`Databases on :${port}:`, dbs.map(d => Object.values(d)[0]));
    await conn.end();
    return true;
  } catch (err) {
    console.log(`✗ Could not connect to 127.0.0.1:${port}: ${err.message}`);
    return false;
  }
}

async function main() {
  await testPort(3306);
  await testPort(3307);
}

main();
