import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Ensure PostgreSQL BIGINT (OID 20) and INTEGER (OID 23) are parsed as JavaScript Numbers
types.setTypeParser(20, (val: string) => parseInt(val, 10));
types.setTypeParser(23, (val: string) => parseInt(val, 10));

const connectionString = process.env.DATABASE_URL;
const maxConnections = parseInt(
  process.env.DB_POOL_MAX || process.env.PGMAX || '20',
  10
);

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        max: maxConnections,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'nexuspay',
        user: process.env.PGUSER || undefined,
        password: process.env.PGPASSWORD || undefined,
        max: maxConnections,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute work inside an isolated ACID database transaction.
 * Acquires a client from the pool, runs BEGIN, invokes fn(client),
 * commits on success, rolls back and rethrows on error, and safely releases
 * the client in a finally block.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during transaction rollback:', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export default pool;
