const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.authorizedStudent.groupBy({
    by: ['department', 'division'],
    _count: { id: true },
    orderBy: [{ department: 'asc' }, { division: 'asc' }],
  });
  console.log('--- Authorized Students Divisions ---');
  console.log(JSON.stringify(depts, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
