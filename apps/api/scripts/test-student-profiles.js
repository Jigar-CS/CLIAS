const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.studentProfile.groupBy({
    by: ['department', 'division'],
    _count: { id: true },
    orderBy: [{ department: 'asc' }, { division: 'asc' }],
  });
  console.log('--- StudentProfile Divisions ---');
  console.log(JSON.stringify(profiles, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
