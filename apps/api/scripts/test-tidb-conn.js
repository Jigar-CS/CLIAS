const { PrismaClient } = require('@prisma/client');

const tidbPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://arirv837sN9hvn9.root:nOCFk8DjGTJKN5lA@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict',
    },
  },
});

async function main() {
  console.log('Testing connection to TiDB...');
  const count = await tidbPrisma.authorizedStudent.count();
  console.log(`TiDB AuthorizedStudent count: ${count}`);

  const userCount = await tidbPrisma.user.count();
  console.log(`TiDB User count: ${userCount}`);
}

main()
  .catch(console.error)
  .finally(() => tidbPrisma.$disconnect());
