"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const init_1 = require("./db/init");
const seed_1 = require("./db/seed");
dotenv_1.default.config();
const PORT = process.env.PORT || 5001;
async function startServer() {
    try {
        // 1. Initialize PostgreSQL database schema
        await (0, init_1.initializeDatabase)();
        // 2. Auto-seed if users table is empty
        const userCountRes = await db_1.pool.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(userCountRes.rows[0].count, 10);
        if (userCount <= 1) {
            await (0, seed_1.seedDatabase)();
        }
        app_1.default.listen(PORT, () => {
            console.log(`
============================================================
🚀 FastPay Engine API Server Running (PostgreSQL)
📡 URL: http://localhost:${PORT}
⚡ Engine: PostgreSQL 16 (Row-Level Locking + ACID)
💼 PSTU National Hackathon 2026
============================================================
      `);
        });
    }
    catch (err) {
        console.error('❌ Failed to start NexusPay backend server:', err);
        process.exit(1);
    }
}
startServer();
