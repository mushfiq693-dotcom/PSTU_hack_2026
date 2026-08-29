import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UserService } from '../services/userService';
import { pool } from '../config/db';

export class UserController {
  /**
   * GET /api/users
   * List all seeded demo accounts for user switcher from PostgreSQL
   */
  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'USER_FETCH_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'USER_FETCH_ERROR',
        message: err.message
      });
    }
  }

  /**
   * GET /api/wallets/me
   * Get active user's wallet profile and balance from PostgreSQL
   */
  public static async getMyWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await UserService.getUserById(userId);

      if (!profile) {
        (res as any).locals.errorCode = 'USER_NOT_FOUND';
        res.status(404).json({
          success: false,
          error_code: 'USER_NOT_FOUND',
          message: 'User profile not found.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'WALLET_FETCH_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'WALLET_FETCH_ERROR',
        message: err.message
      });
    }
  }

  /**
   * POST /api/wallets/unfreeze
   * Verified owner unfreezes wallet after fraud inspection
   */
  public static async unfreezeWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await pool.query(
        `UPDATE wallets SET status = 'ACTIVE', updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );

      await pool.query(
        `INSERT INTO notifications (id, user_id, type, reference_id, title, message, is_read, created_at)
         VALUES ($1, $2, 'SECURITY_RESTORED', $3, $4, $5, FALSE, NOW())`,
        [
          `notif-unfreeze-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId,
          `unfreeze-${Date.now()}`,
          '🛡️ Account Restored: Wallet Unfrozen',
          'Your wallet has been safely verified and restored to ACTIVE status by the account owner.'
        ]
      );

      const profile = await UserService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'Wallet successfully unfrozen and restored to ACTIVE status.',
        data: profile
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'WALLET_UNFREEZE_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'WALLET_UNFREEZE_ERROR',
        message: err.message
      });
    }
  }

  /**
   * POST /api/dev/reset
   * Reset database back to initial seed data
   */
  public static async resetDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await UserService.resetDemo();
      res.status(200).json({
        success: true,
        message: 'Demo dataset reset to initial state with ৳100,000 per user in PostgreSQL.'
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'RESET_FAILED';
      res.status(500).json({
        success: false,
        error_code: 'RESET_FAILED',
        message: err.message
      });
    }
  }
}
