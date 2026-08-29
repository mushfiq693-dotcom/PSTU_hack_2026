import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { User, Wallet } from '../types';
import { Request } from 'express';
import { AuthService } from '../services/authService';
import { Logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: User;
  wallet?: Wallet;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = req.requestId;
  try {
    const authHeader = req.headers['authorization'];
    const userIdHeader = req.headers['x-user-id'] as string;

    let userId: string | undefined;

    // 1. Check Bearer JWT Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = AuthService.verifyToken(token);
        userId = decoded.userId;
      } catch (jwtErr: any) {
        Logger.warn('AUTH', 'INVALID_TOKEN', 'JWT verification failed', {
          requestId,
          error: jwtErr.message,
          errorCode: 'INVALID_TOKEN',
        });
        (res as any).locals.errorCode = 'INVALID_TOKEN';
        res.status(401).json({
          success: false,
          error_code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token.'
        });
        return;
      }
    }

    // 2. Fallback to X-User-Id (for Hackathon Persona Switcher and integration tests)
    if (!userId && userIdHeader) {
      userId = userIdHeader.trim();
    }

    // 3. Fallback default for demo persona if neither provided
    if (!userId) {
      userId = 'usr_shakib_01';
    }

    const userRes = await pool.query(
      'SELECT id, name, phone, email, avatar, phone_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      Logger.warn('AUTH', 'UNAUTHORIZED', `User session '${userId}' not found`, {
        requestId,
        userId,
        errorCode: 'UNAUTHORIZED_USER',
      });
      (res as any).locals.errorCode = 'UNAUTHORIZED_USER';
      res.status(401).json({
        success: false,
        error_code: 'UNAUTHORIZED_USER',
        message: `User session '${userId}' not found.`
      });
      return;
    }

    const user = userRes.rows[0] as User;

    const walletRes = await pool.query(
      'SELECT id, user_id, currency, balance, status, updated_at FROM wallets WHERE user_id = $1',
      [userId]
    );

    req.user = user;
    req.wallet = walletRes.rows[0] as Wallet;

    Logger.debug('AUTH', 'RESOLVED', '', {
      requestId,
      userId: req.user.id,
      walletId: req.wallet?.id,
    });

    next();
  } catch (err: any) {
    Logger.error('AUTH', 'ERROR', 'Authentication middleware error', {
      requestId,
      error: err.message,
    }, err);
    next(err);
  }
}
