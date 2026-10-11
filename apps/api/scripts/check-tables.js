const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log('Tables:', tables);
  const upCols = await prisma.$queryRawUnsafe('DESCRIBE user_profiles').catch(() => []);
  console.log('user_profiles cols:', upCols);
  process.exit(0);
}
main();
