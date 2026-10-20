const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name AS tableName, table_rows AS rowCount
    FROM information_schema.tables
    WHERE table_schema = 'clias_db'
    ORDER BY table_rows DESC
  `);
  const serialized = tables.map(t => ({
    tableName: t.tableName,
    rowCount: Number(t.rowCount)
  }));
  console.log('Tables in localhost:3307/clias_db:');
  console.log(JSON.stringify(serialized, null, 2));

  const authCount = await prisma.authorizedStudent.count().catch((e) => e.message);
  console.log('AuthorizedStudent count:', authCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
