import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function initializeDatabase(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await pool.query(schemaSql);
    console.log('✅ PostgreSQL Schema initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL Schema:', err);
    throw err;
  }
}

if (require.main === module || process.argv[1]?.endsWith('init.ts')) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
