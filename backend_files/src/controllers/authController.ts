import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AuthService } from '../services/authService';
import { Logger } from '../utils/logger';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a user and dispatches OTP
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const { name, phone, password, email } = req.body;

      const result = await AuthService.register(
        {
          name,
          phone,
          password,
          email,
        },
        requestId
      );

      res.status(201).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'REGISTRATION_FAILED';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message || 'Registration failed.',
      });
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Validates OTP code and activates user account with JWT
   */
  public static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        (res as any).locals.errorCode = 'INVALID_INPUT';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_INPUT',
          message: 'Phone number and OTP code are required.',
        });
        return;
      }

      const result = await AuthService.verifyOtp(phone, otp, requestId);
      res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      const errorCode = err.errorCode || 'OTP_VERIFICATION_FAILED';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message || 'OTP verification failed.',
      });
    }
  }

  /**
   * POST /api/auth/resend-otp
   * Resends fresh OTP if cooldown has elapsed
   */
  public static async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const { phone } = req.body;

      if (!phone) {
        (res as any).locals.errorCode = 'INVALID_PHONE';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_PHONE',
          message: 'Phone number is required.',
        });
        return;
      }

      const result = await AuthService.resendOtp(phone, requestId);
      res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 400;
      const errorCode = err.errorCode || 'RESEND_OTP_FAILED';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message || 'Failed to resend OTP.',
        remaining_seconds: err.remainingSeconds,
      });
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user via phone & password
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        (res as any).locals.errorCode = 'INVALID_CREDENTIALS';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          message: 'Phone number and password are required.',
        });
        return;
      }

      const result = await AuthService.login({ phone, password }, requestId);
      res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 401;
      const errorCode = err.errorCode || 'AUTHENTICATION_FAILED';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message || 'Authentication failed.',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Invalidates client session
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    Logger.info('AUTH', 'LOGOUT', 'User logged out', { requestId });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user's profile and wallet
   */
  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const userId = req.user?.id;
      if (!userId) {
        (res as any).locals.errorCode = 'UNAUTHORIZED';
        res.status(401).json({
          success: false,
          error_code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        });
        return;
      }

      const profile = await AuthService.getMe(userId);
      if (!profile) {
        (res as any).locals.errorCode = 'USER_NOT_FOUND';
        res.status(404).json({
          success: false,
          error_code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'PROFILE_FETCH_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'PROFILE_FETCH_ERROR',
        message: err.message,
      });
    }
  }
}
