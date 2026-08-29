import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { PhoneVerification } from '../types';
import { SmsProvider } from '../providers/sms/smsProvider.interface';
import { defaultSmsProvider } from '../providers/sms/demoSmsProvider';
import { Logger } from '../utils/logger';

export class OtpService {
  private static smsProvider: SmsProvider = defaultSmsProvider;
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly RESEND_COOLDOWN_SECONDS = 60;

  public static setSmsProvider(provider: SmsProvider): void {
    this.smsProvider = provider;
  }

  /**
   * Generates a cryptographically secure 6-digit numeric OTP
   */
  public static generateSecureOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Creates a new hashed OTP verification record and dispatches via SMS Provider
   */
  public static async createAndSendOtp(
    userId: string,
    phone: string,
    requestId?: string
  ): Promise<{ verificationId: string; expiresInSeconds: number; cooldownSeconds: number; devOtp?: string }> {
    // 1. Check Resend Cooldown (60 seconds)
    const latestRes = await pool.query(
      `SELECT created_at, verified_at, expires_at 
       FROM phone_verifications 
       WHERE phone = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phone]
    );

    if (latestRes.rows.length > 0) {
      const latest = latestRes.rows[0];
      const timeSinceCreatedMs = Date.now() - new Date(latest.created_at).getTime();
      const cooldownMs = this.RESEND_COOLDOWN_SECONDS * 1000;

      if (timeSinceCreatedMs < cooldownMs && !latest.verified_at) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceCreatedMs) / 1000);
        Logger.warn('AUTH', 'OTP_RATE_LIMITED', `OTP resend cooldown active for phone`, {
          requestId,
          phone,
          remainingSeconds,
          errorCode: 'OTP_RATE_LIMITED',
        });

        const error: any = new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
        error.statusCode = 429;
        error.errorCode = 'OTP_RATE_LIMITED';
        error.remainingSeconds = remainingSeconds;
        throw error;
      }
    }

    // 2. Generate cryptographically secure OTP & Hash
    const rawOtp = this.generateSecureOtp();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const verificationId = uuidv4();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // 3. Store hashed OTP in database (NEVER store plaintext OTP)
    await pool.query(
      `INSERT INTO phone_verifications (id, user_id, phone, otp_hash, expires_at, attempts, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, CURRENT_TIMESTAMP)`,
      [verificationId, userId, phone, otpHash, expiresAt]
    );

    Logger.info('AUTH', 'OTP_CREATED', '', {
      requestId,
      userId,
      phone,
      verificationId,
      expiresIn: `${this.OTP_EXPIRY_MINUTES * 60}s`,
    });

    // 4. Dispatch via SMS provider abstraction
    await this.smsProvider.sendOtp(phone, rawOtp);

    Logger.info('AUTH', 'OTP_SENT', 'Dispatched OTP via SMS provider', {
      requestId,
      userId,
      phone,
      verificationId,
    });

    return {
      verificationId,
      expiresInSeconds: this.OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
      devOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    };
  }

  /**
   * Verifies the submitted OTP against the latest active verification record
   */
  public static async verifyOtp(
    phone: string,
    otp: string,
    requestId?: string
  ): Promise<{ userId: string; verified: boolean }> {
    // 1. Fetch latest verification record for phone
    const res = await pool.query(
      `SELECT id, user_id, phone, otp_hash, expires_at, attempts, verified_at 
       FROM phone_verifications 
       WHERE phone = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phone]
    );

    if (res.rows.length === 0) {
      Logger.warn('AUTH', 'OTP_INVALID', 'No active verification record found for phone', {
        requestId,
        phone,
        errorCode: 'OTP_INVALID',
      });
      const error: any = new Error('No active OTP verification found. Please request a new OTP.');
      error.statusCode = 400;
      error.errorCode = 'OTP_INVALID';
      throw error;
    }

    const verification = res.rows[0] as PhoneVerification;

    // 2. Check if already verified (Single-use enforcement)
    if (verification.verified_at) {
      Logger.warn('AUTH', 'OTP_ALREADY_USED', 'Attempted to reuse already verified OTP', {
        requestId,
        phone,
        verificationId: verification.id,
        errorCode: 'OTP_INVALID',
      });
      const error: any = new Error('This OTP has already been used. Please request a new OTP.');
      error.statusCode = 400;
      error.errorCode = 'OTP_INVALID';
      throw error;
    }

    // 3. Check Expiration
    if (new Date() > new Date(verification.expires_at)) {
      Logger.warn('AUTH', 'OTP_EXPIRED', 'OTP verification expired', {
        requestId,
        phone,
        verificationId: verification.id,
        errorCode: 'OTP_EXPIRED',
      });
      const error: any = new Error('OTP has expired. Please request a new one.');
      error.statusCode = 400;
      error.errorCode = 'OTP_EXPIRED';
      throw error;
    }

    // 4. Check Maximum Attempts (5 attempts)
    if (verification.attempts >= this.MAX_ATTEMPTS) {
      Logger.warn('AUTH', 'OTP_ATTEMPTS_EXCEEDED', 'Max verification attempts exceeded', {
        requestId,
        phone,
        verificationId: verification.id,
        attempts: verification.attempts,
        errorCode: 'OTP_ATTEMPTS_EXCEEDED',
      });
      const error: any = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      error.statusCode = 429;
      error.errorCode = 'OTP_ATTEMPTS_EXCEEDED';
      throw error;
    }

    // 5. Compare Submitted OTP against Hashed OTP
    const isMatch = await bcrypt.compare(otp, verification.otp_hash);

    if (!isMatch) {
      const newAttempts = verification.attempts + 1;
      await pool.query(
        `UPDATE phone_verifications SET attempts = $1 WHERE id = $2`,
        [newAttempts, verification.id]
      );

      const remainingAttempts = Math.max(0, this.MAX_ATTEMPTS - newAttempts);
      Logger.warn('AUTH', 'OTP_INVALID', 'Incorrect OTP entered', {
        requestId,
        phone,
        verificationId: verification.id,
        attemptsUsed: newAttempts,
        remainingAttempts,
        errorCode: 'OTP_INVALID',
      });

      const error: any = new Error(
        remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
          : 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.'
      );
      error.statusCode = 400;
      error.errorCode = remainingAttempts > 0 ? 'OTP_INVALID' : 'OTP_ATTEMPTS_EXCEEDED';
      throw error;
    }

    // 6. Valid OTP -> Mark verified
    await pool.query(
      `UPDATE phone_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [verification.id]
    );

    Logger.info('AUTH', 'OTP_VERIFIED', 'OTP successfully verified', {
      requestId,
      phone,
      userId: verification.user_id,
      verificationId: verification.id,
    });

    return {
      userId: verification.user_id,
      verified: true,
    };
  }
}
