const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres',
  });

  const client = await pool.connect();
  try {
    // Insert default branch
    await client.query(
      `INSERT INTO food_ordering."Branch" (name, code, "isActive", "createdAt", "updatedAt")
       VALUES ('สาขาหลัก', 'MAIN', true, NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`
    );

    // Get the branch id
    const res = await client.query(`SELECT id FROM food_ordering."Branch" WHERE code = 'MAIN'`);
    const branchId = res.rows[0] && res.rows[0].id;
    if (!branchId) {
      console.log('Could not find default branch');
      return;
    }
    console.log('Default branch id:', branchId);

    // Update all records
    const tables = ['MenuItem', 'Order', 'QueueTicket', 'Table', 'Payment', 'Ingredient', 'ServiceRequest', 'AddOn', 'AddOnGroup'];
    for (const table of tables) {
      const r = await client.query(
        `UPDATE food_ordering."${table}" SET "branchId" = $1 WHERE "branchId" IS NULL`,
        [branchId]
      );
      console.log(`Updated ${table}: ${r.rowCount} rows`);
    }

    // Update non-admin users
    const ur = await client.query(
      `UPDATE food_ordering."User" SET "branchId" = $1 WHERE role != 'ADMIN' AND "branchId" IS NULL`,
      [branchId]
    );
    console.log(`Updated User: ${ur.rowCount} rows`);

    console.log('Data migration completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
