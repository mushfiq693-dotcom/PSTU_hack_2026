import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { UserService } from '../services/userService';

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
      res.status(500).json({
        success: false,
        error_code: 'WALLET_FETCH_ERROR',
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
      res.status(500).json({
        success: false,
        error_code: 'RESET_FAILED',
        message: err.message
      });
    }
  }
}
