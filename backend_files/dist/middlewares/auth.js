"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const db_1 = require("../config/db");
async function authMiddleware(req, res, next) {
    try {
        const userIdHeader = req.headers['x-user-id'];
        const authHeader = req.headers['authorization'];
        let userId = userIdHeader;
        if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
            userId = authHeader.substring(7).trim();
        }
        // Default to first demo user (Shakib) if nothing provided
        if (!userId) {
            userId = 'usr_shakib_01';
        }
        const userRes = await db_1.pool.query('SELECT id, name, phone, email, avatar, created_at FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            res.status(401).json({
                success: false,
                error_code: 'UNAUTHORIZED_USER',
                message: `User session '${userId}' not found.`
            });
            return;
        }
        const walletRes = await db_1.pool.query('SELECT id, user_id, currency, balance, status, updated_at FROM wallets WHERE user_id = $1', [userId]);
        req.user = userRes.rows[0];
        req.wallet = walletRes.rows[0];
        next();
    }
    catch (err) {
        next(err);
    }
}
