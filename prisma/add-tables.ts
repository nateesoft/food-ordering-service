import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TableStatus } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'food_ordering' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding tables A1-C4...');

  const tablesToAdd = [
    { number: 'A1', capacity: 2, size: 'small', positionX: 100, positionY: 100 },
    { number: 'A2', capacity: 2, size: 'small', positionX: 200, positionY: 100 },
    { number: 'A3', capacity: 4, size: 'medium', positionX: 300, positionY: 100 },
    { number: 'A4', capacity: 4, size: 'medium', positionX: 400, positionY: 100 },
    { number: 'B1', capacity: 4, size: 'medium', positionX: 100, positionY: 200 },
    { number: 'B2', capacity: 4, size: 'medium', positionX: 200, positionY: 200 },
    { number: 'B3', capacity: 6, size: 'large', positionX: 300, positionY: 200 },
    { number: 'C1', capacity: 6, size: 'large', positionX: 100, positionY: 300 },
    { number: 'C2', capacity: 6, size: 'large', positionX: 200, positionY: 300 },
    { number: 'C3', capacity: 8, size: 'large', positionX: 300, positionY: 300 },
    { number: 'C4', capacity: 8, size: 'large', positionX: 400, positionY: 300 },
  ];

  for (const table of tablesToAdd) {
    const existing = await prisma.table.findUnique({ where: { number: table.number } });
    if (!existing) {
      await prisma.table.create({
        data: {
          ...table,
          status: TableStatus.AVAILABLE,
        },
      });
      console.log(`Created table ${table.number}`);
    } else {
      console.log(`Table ${table.number} already exists`);
    }
  }

  // List all tables
  const allTables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
  console.log('\nAll tables in database:');
  allTables.forEach(t => console.log(`  - ${t.number} (${t.size}, ${t.capacity} seats)`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
