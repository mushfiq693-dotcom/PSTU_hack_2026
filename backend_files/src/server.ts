import dotenv from 'dotenv';
import app from './app';
import { pool } from './config/db';
import { initializeDatabase } from './db/init';
import { seedDatabase } from './db/seed';
import { Logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 5001;

async function startServer(): Promise<void> {
  try {
    Logger.info('SYSTEM', 'INIT_START', 'Initializing PostgreSQL database schema');
    // 1. Initialize PostgreSQL database schema
    await initializeDatabase();

    // 2. Auto-seed if users table is empty
    const userCountRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountRes.rows[0].count, 10);
    if (userCount <= 1) {
      Logger.info('SYSTEM', 'SEEDING', 'Seeding demo user accounts with ৳100,000 baseline');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      Logger.info('SERVER', 'START', `FastPay Engine API Server Running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        engine: 'PostgreSQL 16 (Row-Level Locking + ACID)',
      });

      console.log(`
============================================================
🚀 FastPay Engine API Server Running (PostgreSQL)
📡 URL: http://localhost:${PORT}
⚡ Engine: PostgreSQL 16 (Row-Level Locking + ACID)
💼 PSTU National Hackathon 2026
============================================================
      `);
    });
  } catch (err: any) {
    Logger.error('SERVER', 'START_FAILED', 'Failed to start FastPay backend server', {
      error: err.message,
    }, err);
    process.exit(1);
  }
}

startServer();
