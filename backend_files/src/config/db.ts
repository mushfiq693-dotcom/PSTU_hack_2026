import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

// Ensure PostgreSQL BIGINT (OID 20) and INTEGER (OID 23) are parsed as JavaScript Numbers
types.setTypeParser(20, (val: string) => parseInt(val, 10));
types.setTypeParser(23, (val: string) => parseInt(val, 10));

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false }, // Required for hosted PostgreSQL (Supabase, Neon, Render, Railway)
        max: 50,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'nexuspay',
        user: process.env.PGUSER || undefined,
        password: process.env.PGPASSWORD || undefined,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        max: 50,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
);

// Graceful pool error logging
pool.on('error', (err) => {
  Logger.error('DB', 'POOL_ERROR', 'Unexpected error on idle PostgreSQL client', { error: err.message }, err);
});

/**
 * Execute single parameterized SQL query with execution timing
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const operation = text.trim().split(' ')[0].toUpperCase();

  Logger.debug('DB', 'QUERY_START', '', {
    operation,
    query: text.length > 80 ? `${text.substring(0, 80)}...` : text,
  });

  try {
    const res = await pool.query<T>(text, params);
    const durationMs = Date.now() - start;

    Logger.debug('DB', 'QUERY_SUCCESS', '', {
      operation,
      duration: `${durationMs}ms`,
      durationMs,
      rows: res.rowCount ?? 0,
    });

    return res;
  } catch (err: any) {
    const durationMs = Date.now() - start;
    Logger.error('DB', 'QUERY_ERROR', 'Database query failed', {
      operation,
      errorCode: err.code || 'DB_ERROR',
      duration: `${durationMs}ms`,
      durationMs,
      error: err.message,
    }, err);
    throw err;
  }
}

/**
 * Get dedicated client from pool for transactions with BEGIN, COMMIT, ROLLBACK
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export default pool;
