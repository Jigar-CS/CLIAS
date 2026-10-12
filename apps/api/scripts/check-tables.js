const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dmmf = (await import('@prisma/client')).Prisma.dmmf;
  const models = dmmf.datamodel.models;
  let fixedCount = 0;

  for (const m of models) {
    const tableName = m.dbName || m.name;
    const cols = await prisma.$queryRawUnsafe(`DESCRIBE \`${tableName}\``).catch(() => null);
    if (!cols) continue;
    const existingColNames = new Set(cols.map((c) => c.Field.toLowerCase()));

    for (const f of m.fields) {
      if (f.kind === 'scalar' || f.kind === 'enum') {
        const colName = (f.dbName || f.name).toLowerCase();
        if (!existingColNames.has(colName)) {
          console.log(`Missing column in ${tableName}: ${f.name} (type: ${f.type})`);
          let sqlType = 'VARCHAR(191) NULL';
          if (f.type === 'Int') sqlType = 'INT NOT NULL DEFAULT 0';
          else if (f.type === 'Float') sqlType = 'DOUBLE NOT NULL DEFAULT 0.0';
          else if (f.type === 'Boolean') sqlType = 'BOOLEAN NOT NULL DEFAULT FALSE';
          else if (f.type === 'DateTime') sqlType = 'DATETIME(3) NULL';
          else if (f.type === 'String' && f.name.toLowerCase().includes('text')) sqlType = 'TEXT NULL';

          try {
            await prisma.$queryRawUnsafe(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${f.name}\` ${sqlType}`);
            console.log(`  -> Successfully added \`${f.name}\` to \`${tableName}\`!`);
            fixedCount++;
          } catch (err) {
            console.error(`  -> Failed to add \`${f.name}\`:`, err.message);
          }
        }
      }
    }
  }

  console.log(`Schema sync complete. Fixed ${fixedCount} missing columns.`);
  process.exit(0);
}
main();
