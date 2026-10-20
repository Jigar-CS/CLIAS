const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      facultyProfile: { select: { id: true, departmentId: true, courseId: true } },
      studentProfile: {
        select: {
          id: true,
          authorizedStudent: { select: { enrollmentNumber: true, name: true, department: true } },
        },
      },
    },
  });
  console.log('Total users:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
