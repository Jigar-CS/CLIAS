const { PrismaClient } = require('@prisma/client');

const tidb = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://arirv837sN9hvn9.root:nOCFk8DjGTJKN5lA@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test?sslaccept=strict',
    },
  },
});

async function main() {
  const dmmf = (await import('@prisma/client')).Prisma.dmmf;
  const models = dmmf.datamodel.models;
  const results = [];

  for (const m of models) {
    const delegate = tidb[m.name.charAt(0).toLowerCase() + m.name.slice(1)];
    if (delegate && typeof delegate.count === 'function') {
      try {
        const count = await delegate.count();
        if (count > 0) {
          results.push({ model: m.name, count });
        }
      } catch (err) {
        // ignore
      }
    }
  }

  console.log('--- TiDB Non-Empty Tables ---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => tidb.$disconnect());
