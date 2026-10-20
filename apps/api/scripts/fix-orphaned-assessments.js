const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: { db: { url: 'mysql://root:@localhost:3307/clias_db' } },
});

const tidbPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://arirv837sN9hvn9.root:nOCFk8DjGTJKN5lA@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict',
    },
  },
});

async function main() {
  const targetCourseId = 'a16c6a6b-d69d-43f9-b3b5-e342e3be461d';
  const orphanedId = '9818bccf-6872-4188-a5c7-66c6fb55e622';

  const resLocal = await localPrisma.$executeRawUnsafe(`
    UPDATE assessment SET courseId = '${targetCourseId}' WHERE courseId = '${orphanedId}'
  `);
  console.log(`Updated ${resLocal} assessments in local MySQL.`);

  try {
    const resTidb = await tidbPrisma.$executeRawUnsafe(`
      UPDATE assessment SET courseId = '${targetCourseId}' WHERE courseId = '${orphanedId}'
    `);
    console.log(`Updated ${resTidb} assessments in TiDB Cloud.`);
  } catch (err) {
    console.log('TiDB update skipped or failed:', err.message);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await localPrisma.$disconnect();
    await tidbPrisma.$disconnect();
  });
