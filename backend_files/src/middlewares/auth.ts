import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { User, Wallet } from '../types';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
  wallet?: Wallet;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userIdHeader = req.headers['x-user-id'] as string;
    const authHeader = req.headers['authorization'];

    let userId = userIdHeader;
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      userId = authHeader.substring(7).trim();
    }

    // Default to first demo user (Shakib) if nothing provided
    if (!userId) {
      userId = 'usr_shakib_01';
    }

    const userRes = await pool.query(
      'SELECT id, name, phone, email, avatar, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({
        success: false,
        error_code: 'UNAUTHORIZED_USER',
        message: `User session '${userId}' not found.`
      });
      return;
    }

    const walletRes = await pool.query(
      'SELECT id, user_id, currency, balance, status, updated_at FROM wallets WHERE user_id = $1',
      [userId]
    );

    req.user = userRes.rows[0] as User;
    req.wallet = walletRes.rows[0] as Wallet;
    next();
  } catch (err) {
    next(err);
  }
}
