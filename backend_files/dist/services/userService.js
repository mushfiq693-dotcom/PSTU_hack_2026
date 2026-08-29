"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const db_1 = require("../config/db");
const seed_1 = require("../db/seed");
class UserService {
    /**
     * Returns all demo users with their current balances from PostgreSQL
     */
    static async getAllUsers() {
        const res = await db_1.pool.query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.avatar,
        u.created_at,
        w.id as wallet_id,
        w.balance,
        w.currency
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE u.id != 'usr_system_treasury'
      ORDER BY u.id ASC
    `);
        return res.rows.map((u) => {
            const balanceNum = Number(u.balance);
            return {
                ...u,
                balance: balanceNum,
                balance_bdt: balanceNum / 100
            };
        });
    }
    /**
     * Retrieves single user profile with wallet information
     */
    static async getUserById(userId) {
        const res = await db_1.pool.query(`SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.avatar,
        u.created_at,
        w.id as wallet_id,
        w.balance,
        w.currency
      FROM users u
      JOIN wallets w ON u.id = w.user_id
      WHERE u.id = $1`, [userId]);
        if (res.rows.length === 0)
            return null;
        const u = res.rows[0];
        const balanceNum = Number(u.balance);
        return {
            ...u,
            balance: balanceNum,
            balance_bdt: balanceNum / 100
        };
    }
    /**
     * Retrieves complete transaction history for a user
     */
    static async getUserTransactions(userId, limit = 50) {
        const walletRes = await db_1.pool.query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
        if (walletRes.rows.length === 0)
            return [];
        const walletId = walletRes.rows[0].id;
        const txRes = await db_1.pool.query(`SELECT 
        t.*,
        su.name as sender_name,
        su.phone as sender_phone,
        ru.name as receiver_name,
        ru.phone as receiver_phone
      FROM transactions t
      LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
      LEFT JOIN users su ON sw.user_id = su.id
      LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
      LEFT JOIN users ru ON rw.user_id = ru.id
      WHERE t.sender_wallet_id = $1 OR t.receiver_wallet_id = $1
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT $2`, [walletId, limit]);
        return txRes.rows.map((t) => ({
            ...t,
            amount: Number(t.amount),
            fee: Number(t.fee)
        }));
    }
    /**
     * Resets database to initial seed state
     */
    static async resetDemo() {
        await (0, seed_1.seedDatabase)();
    }
}
exports.UserService = UserService;
