const { PrismaClient } = require('@prisma/client');

async function test(port) {
  const p = new PrismaClient({
    datasources: { db: { url: `mysql://root:@localhost:${port}/clias_db` } }
  });
  try {
    await p.$connect();
    console.log(`✓ Prisma connected on port ${port}!`);
    await p.$disconnect();
  } catch (e) {
    console.log(`✗ Failed on port ${port}: ${e.message}`);
  }
}

async function main() {
  await test(3306);
  await test(3307);
}

main();
