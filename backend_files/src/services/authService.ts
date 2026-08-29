import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { User, SafeUser, UserWithWallet, RegisterDto, LoginDto, AuthResponse } from '../types';
import { OtpService } from './otpService';
import { Logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fastpay_engine_jwt_secret_pstu_2026';
const JWT_EXPIRY = '7d';

/**
 * Normalizes phone numbers to standard 11-digit Bangladesh mobile format (01XXXXXXXXX)
 */
export function normalizePhone(rawPhone: string): string {
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
}

/**
 * Validates Bangladesh mobile phone numbers (013-019 followed by 8 digits)
 */
export function isValidPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}

export class AuthService {
  /**
   * Generates signed JWT authentication token
   */
  public static generateToken(user: SafeUser): string {
    return jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
  }

  /**
   * Verifies JWT authentication token
   */
  public static verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }

  /**
   * Transforms raw user row into safe public user profile (excluding passwords/hashes)
   */
  public static toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      phone_verified: user.phone_verified,
      created_at: user.created_at,
    };
  }

  /**
   * Registers a new user account with phone_verified = false and triggers OTP dispatch
   */
  public static async register(dto: RegisterDto, requestId?: string): Promise<AuthResponse> {
    const { name, phone: rawPhone, password, email, avatar } = dto;

    Logger.info('AUTH', 'REGISTER_START', 'Initiating user registration', {
      requestId,
      rawPhone,
      hasEmail: !!email,
      hasAvatar: !!avatar,
    });

    // 1. Validation
    if (!name || name.trim().length < 2) {
      const error: any = new Error('Name must be at least 2 characters long.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_NAME';
      throw error;
    }

    const normalizedPhone = normalizePhone(rawPhone);
    if (!isValidPhone(normalizedPhone)) {
      Logger.warn('AUTH', 'INVALID_PHONE', `Invalid phone number format: ${rawPhone}`, {
        requestId,
        rawPhone,
        normalizedPhone,
        errorCode: 'INVALID_PHONE',
      });
      const error: any = new Error('Please provide a valid 11-digit mobile number (e.g. 017XXXXXXXX).');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PHONE';
      throw error;
    }

    if (!password || password.length < 6) {
      Logger.warn('AUTH', 'INVALID_PASSWORD', 'Password does not meet minimum length', {
        requestId,
        errorCode: 'INVALID_PASSWORD',
      });
      const error: any = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PASSWORD';
      throw error;
    }

    // 2. Check if phone already exists
    const existingRes = await pool.query(
      'SELECT id, name, phone, phone_verified FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    let userId: string;
    const chosenAvatar = avatar?.trim() || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    if (existingRes.rows.length > 0) {
      const existingUser = existingRes.rows[0];

      if (existingUser.phone_verified) {
        Logger.warn('AUTH', 'PHONE_ALREADY_EXISTS', `Phone ${normalizedPhone} is already registered and verified`, {
          requestId,
          phone: normalizedPhone,
          errorCode: 'PHONE_ALREADY_EXISTS',
        });
        const error: any = new Error('An account with this phone number already exists.');
        error.statusCode = 409;
        error.errorCode = 'PHONE_ALREADY_EXISTS';
        throw error;
      }

      // If user registered earlier but never completed phone verification, update credentials
      userId = existingUser.id;
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE users 
         SET name = $1, password_hash = $2, email = $3, avatar = COALESCE($4, avatar), created_at = CURRENT_TIMESTAMP 
         WHERE id = $5`,
        [name.trim(), passwordHash, email?.trim() || null, avatar?.trim() || null, userId]
      );
    } else {
      // 3. Create new unverified user
      userId = `usr_${uuidv4().substring(0, 8)}`;
      const walletId = `wlt_${userId.replace('usr_', '')}`;
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.query(
        `INSERT INTO users (id, name, phone, email, avatar, password_hash, phone_verified, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)`,
        [userId, name.trim(), normalizedPhone, email?.trim() || null, chosenAvatar, passwordHash]
      );

      // Create initial wallet (0 balance)
      await pool.query(
        `INSERT INTO wallets (id, user_id, currency, balance, status)
         VALUES ($1, $2, 'BDT', 0, 'ACTIVE')`,
        [walletId, userId]
      );
    }

    // 4. Generate & Send OTP
    const otpResult = await OtpService.createAndSendOtp(userId, normalizedPhone, requestId);

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const safeUser = this.toSafeUser(userRes.rows[0] as User);

    return {
      success: true,
      message: 'Registration successful. OTP verification code sent to your phone.',
      user: safeUser,
      phone: normalizedPhone,
      phone_verified: false,
      dev_otp: otpResult.devOtp,
    };
  }

  /**
   * Verifies OTP code and activates user account
   */
  public static async verifyOtp(rawPhone: string, otp: string, requestId?: string): Promise<AuthResponse> {
    const normalizedPhone = normalizePhone(rawPhone);

    if (!isValidPhone(normalizedPhone)) {
      const error: any = new Error('Please provide a valid phone number.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PHONE';
      throw error;
    }

    if (!otp || otp.trim().length !== 6) {
      const error: any = new Error('Please enter a valid 6-digit OTP.');
      error.statusCode = 400;
      error.errorCode = 'OTP_INVALID';
      throw error;
    }

    // 1. Verify OTP with OTP service
    const { userId } = await OtpService.verifyOtp(normalizedPhone, otp.trim(), requestId);

    // 2. Set phone_verified = true on users table
    await pool.query(
      `UPDATE users SET phone_verified = TRUE WHERE id = $1`,
      [userId]
    );

    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0] as User;
    const safeUser = this.toSafeUser(user);

    // 3. Issue authentication JWT
    const token = this.generateToken(safeUser);

    Logger.info('AUTH', 'OTP_VERIFIED', `User phone verified and activated`, {
      requestId,
      userId,
      phone: normalizedPhone,
    });

    return {
      success: true,
      message: 'Phone number verified successfully. Account activated.',
      token,
      user: safeUser,
      phone_verified: true,
    };
  }

  /**
   * Resends a new OTP with 60-second cooldown protection
   */
  public static async resendOtp(rawPhone: string, requestId?: string): Promise<{ success: boolean; message: string; phone: string; dev_otp?: string }> {
    const normalizedPhone = normalizePhone(rawPhone);

    if (!isValidPhone(normalizedPhone)) {
      const error: any = new Error('Please provide a valid phone number.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PHONE';
      throw error;
    }

    const userRes = await pool.query('SELECT id, phone_verified FROM users WHERE phone = $1', [normalizedPhone]);
    if (userRes.rows.length === 0) {
      Logger.warn('AUTH', 'USER_NOT_FOUND', `Attempted to resend OTP for unregistered phone`, {
        requestId,
        phone: normalizedPhone,
        errorCode: 'USER_NOT_FOUND',
      });
      const error: any = new Error('No registered account found with this phone number.');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    const user = userRes.rows[0];
    if (user.phone_verified) {
      return {
        success: true,
        message: 'This phone number is already verified. Please log in.',
        phone: normalizedPhone,
      };
    }

    const otpResult = await OtpService.createAndSendOtp(user.id, normalizedPhone, requestId);

    return {
      success: true,
      message: 'New OTP sent to your phone.',
      phone: normalizedPhone,
      dev_otp: otpResult.devOtp,
    };
  }

  /**
   * Authenticates user via phone & password, requiring phone_verified = true
   */
  public static async login(dto: LoginDto, requestId?: string): Promise<AuthResponse> {
    const { phone: rawPhone, password } = dto;
    const normalizedPhone = normalizePhone(rawPhone);

    if (!normalizedPhone || !password) {
      const error: any = new Error('Phone number and password are required.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_CREDENTIALS';
      throw error;
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [normalizedPhone]
    );

    if (userRes.rows.length === 0) {
      Logger.warn('AUTH', 'LOGIN_FAILED', 'User phone not found', {
        requestId,
        phone: normalizedPhone,
        errorCode: 'AUTHENTICATION_FAILED',
      });
      const error: any = new Error('Invalid phone number or password.');
      error.statusCode = 401;
      error.errorCode = 'AUTHENTICATION_FAILED';
      throw error;
    }

    const user = userRes.rows[0] as User;

    // Check Password Hash
    if (!user.password_hash) {
      Logger.warn('AUTH', 'LOGIN_FAILED', 'User account has no password hash set', {
        requestId,
        userId: user.id,
        errorCode: 'AUTHENTICATION_FAILED',
      });
      const error: any = new Error('Invalid phone number or password.');
      error.statusCode = 401;
      error.errorCode = 'AUTHENTICATION_FAILED';
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      Logger.warn('AUTH', 'LOGIN_FAILED', 'Incorrect password entered', {
        requestId,
        userId: user.id,
        errorCode: 'AUTHENTICATION_FAILED',
      });
      const error: any = new Error('Invalid phone number or password.');
      error.statusCode = 401;
      error.errorCode = 'AUTHENTICATION_FAILED';
      throw error;
    }

    // Check Phone Verified
    if (!user.phone_verified) {
      Logger.warn('AUTH', 'PHONE_NOT_VERIFIED', 'Unverified user attempted to log in', {
        requestId,
        userId: user.id,
        phone: normalizedPhone,
        errorCode: 'PHONE_NOT_VERIFIED',
      });
      const error: any = new Error('Phone number is not verified. Please verify your OTP to log in.');
      error.statusCode = 403;
      error.errorCode = 'PHONE_NOT_VERIFIED';
      throw error;
    }

    const safeUser = this.toSafeUser(user);
    const token = this.generateToken(safeUser);

    Logger.info('AUTH', 'LOGIN_SUCCESS', 'User logged in successfully', {
      requestId,
      userId: user.id,
      phone: normalizedPhone,
    });

    return {
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
      phone_verified: true,
    };
  }

  /**
   * Retrieves profile and wallet for the authenticated user
   */
  public static async getMe(userId: string): Promise<UserWithWallet | null> {
    const res = await pool.query(
      `SELECT 
        u.id, u.name, u.phone, u.email, u.avatar, u.phone_verified, u.created_at,
        w.id as wallet_id, w.currency, w.balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      avatar: row.avatar,
      phone_verified: row.phone_verified,
      created_at: row.created_at,
      wallet_id: row.wallet_id,
      currency: row.currency || 'BDT',
      balance: Number(row.balance || 0),
      balance_bdt: Number(row.balance || 0) / 100,
    };
  }

  /**
   * Updates user profile (name, email, avatar)
   */
  public static async updateProfile(
    userId: string,
    dto: { name?: string; email?: string; avatar?: string },
    requestId?: string
  ): Promise<UserWithWallet> {
    const { name, email, avatar } = dto;

    if (name !== undefined && name.trim().length < 2) {
      const error: any = new Error('Name must be at least 2 characters long.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_NAME';
      throw error;
    }

    await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           avatar = COALESCE($3, avatar)
       WHERE id = $4`,
      [
        name !== undefined ? name.trim() : null,
        email !== undefined ? email.trim() || null : null,
        avatar !== undefined ? avatar.trim() : null,
        userId,
      ]
    );

    Logger.info('AUTH', 'PROFILE_UPDATED', 'User updated profile', {
      requestId,
      userId,
      hasAvatar: !!avatar,
    });

    const updatedProfile = await this.getMe(userId);
    if (!updatedProfile) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    return updatedProfile;
  }
}
