const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT a.id, a.code, a.title, a.courseId, c.id AS matchedCourseId
    FROM assessment a
    LEFT JOIN course c ON a.courseId = c.id
  `);
  console.log('Assessments with course matches:');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
