"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.getClient = getClient;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Ensure PostgreSQL BIGINT (OID 20) and INTEGER (OID 23) are parsed as JavaScript Numbers
pg_1.types.setTypeParser(20, (val) => parseInt(val, 10));
pg_1.types.setTypeParser(23, (val) => parseInt(val, 10));
const connectionString = process.env.DATABASE_URL;
exports.pool = new pg_1.Pool(connectionString
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
    });
// Graceful pool error logging
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
/**
 * Execute single parameterized SQL query
 */
async function query(text, params) {
    return exports.pool.query(text, params);
}
/**
 * Get dedicated client from pool for transactions with BEGIN, COMMIT, ROLLBACK
 */
async function getClient() {
    return exports.pool.connect();
}
exports.default = exports.pool;
