const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assessments = await prisma.assessment.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      courseId: true,
      course: { select: { id: true, code: true, name: true } },
    },
  });
  console.log('Assessments in local DB:', JSON.stringify(assessments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
