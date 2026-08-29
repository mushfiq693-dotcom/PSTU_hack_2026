import { pool } from '../config/db';
import { UserWithWallet, Transaction } from '../types';
import { seedDatabase } from '../db/seed';
import { MemoryCache } from '../utils/cache';

export class UserService {
  /**
   * Returns all demo users with their current balances from PostgreSQL (Cached with TTL)
   */
  public static async getAllUsers(): Promise<UserWithWallet[]> {
    const cacheKey = 'users:all';
    const cached = MemoryCache.get<UserWithWallet[]>(cacheKey);
    if (cached) return cached;

    const res = await pool.query(`
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

    const users = res.rows.map((u) => {
      const balanceNum = Number(u.balance);
      return {
        ...u,
        balance: balanceNum,
        balance_bdt: balanceNum / 100
      };
    });

    MemoryCache.set(cacheKey, users, 10);
    return users;
  }

  /**
   * Retrieves single user profile with wallet information (Cached)
   */
  public static async getUserById(userId: string): Promise<UserWithWallet | null> {
    const cacheKey = `user:${userId}`;
    const cached = MemoryCache.get<UserWithWallet>(cacheKey);
    if (cached) return cached;

    const res = await pool.query(
      `SELECT 
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
      WHERE u.id = $1`,
      [userId]
    );

    if (res.rows.length === 0) return null;

    const u = res.rows[0];
    const balanceNum = Number(u.balance);

    const userProfile: UserWithWallet = {
      ...u,
      balance: balanceNum,
      balance_bdt: balanceNum / 100
    };

    MemoryCache.set(cacheKey, userProfile, 10);
    return userProfile;
  }

  /**
   * Retrieves complete transaction history for a user
   */
  public static async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const cacheKey = `txs:${userId}:${limit}`;
    const cached = MemoryCache.get<Transaction[]>(cacheKey);
    if (cached) return cached;

    const walletRes = await pool.query('SELECT id FROM wallets WHERE user_id = $1', [userId]);
    if (walletRes.rows.length === 0) return [];

    const walletId = walletRes.rows[0].id;

    const txRes = await pool.query(
      `SELECT 
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
      LIMIT $2`,
      [walletId, limit]
    );

    const txs = txRes.rows.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee)
    })) as Transaction[];

    MemoryCache.set(cacheKey, txs, 8);
    return txs;
  }

  /**
   * Resets database to initial seed state & clears memory cache
   */
  public static async resetDemo(): Promise<void> {
    MemoryCache.clear();
    await seedDatabase();
  }
}
