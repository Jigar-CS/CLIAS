const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS faculty_course_assignments (
      id VARCHAR(191) PRIMARY KEY,
      facultyId VARCHAR(191) NOT NULL,
      courseId VARCHAR(191) NOT NULL,
      assignedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_fac_course (facultyId, courseId),
      INDEX idx_fac (facultyId),
      INDEX idx_course (courseId)
    )
  `);
  console.log('✅ faculty_course_assignments table ready in database!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
