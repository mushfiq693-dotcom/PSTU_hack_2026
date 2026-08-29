import dotenv from 'dotenv';
import app from './app';
import { pool } from './config/db';
import { initializeDatabase } from './db/init';
import { seedDatabase } from './db/seed';

dotenv.config();

const PORT = process.env.PORT || 5001;

async function startServer(): Promise<void> {
  try {
    // 1. Initialize PostgreSQL database schema
    await initializeDatabase();

    // 2. Auto-seed if users table is empty
    const userCountRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountRes.rows[0].count, 10);
    if (userCount <= 1) {
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`
============================================================
🚀 FastPay Engine API Server Running (PostgreSQL)
📡 URL: http://localhost:${PORT}
⚡ Engine: PostgreSQL 16 (Row-Level Locking + ACID)
💼 PSTU National Hackathon 2026
============================================================
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start NexusPay backend server:', err);
    process.exit(1);
  }
}

startServer();
