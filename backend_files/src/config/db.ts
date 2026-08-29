import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Ensure PostgreSQL BIGINT (OID 20) and INTEGER (OID 23) are parsed as JavaScript Numbers
types.setTypeParser(20, (val: string) => parseInt(val, 10));
types.setTypeParser(23, (val: string) => parseInt(val, 10));

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'nexuspay',
        user: process.env.PGUSER || undefined,
        password: process.env.PGPASSWORD || undefined,
        max: 50, // High connection pool for concurrent stress tests
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// Graceful pool error logging
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute single parameterized SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Get dedicated client from pool for transactions with BEGIN, COMMIT, ROLLBACK
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export default pool;
