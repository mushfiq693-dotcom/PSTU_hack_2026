import { PoolClient } from 'pg';

export interface WalletRepository {
  getBalanceForUpdate(userId: string, client: PoolClient): Promise<number>;
  debit(userId: string, amount: number, client: PoolClient): Promise<void>;
  credit(userId: string, amount: number, client: PoolClient): Promise<void>;
}

export class PostgresWalletRepository implements WalletRepository {
  /**
   * Acquire row lock with SELECT ... FOR UPDATE and return current balance in Poisha
   */
  async getBalanceForUpdate(userId: string, client: PoolClient): Promise<number> {
    const res = await client.query(
      `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (res.rows.length === 0) {
      const error: any = new Error(`Wallet not found for user: ${userId}`);
      error.statusCode = 404;
      error.errorCode = 'WALLET_NOT_FOUND';
      throw error;
    }

    return Number(res.rows[0].balance);
  }

  /**
   * Debit money from wallet (balance in Poisha)
   */
  async debit(userId: string, amount: number, client: PoolClient): Promise<void> {
    const res = await client.query(
      `UPDATE wallets 
       SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND balance >= $1 
       RETURNING balance`,
      [amount, userId]
    );

    if (res.rowCount === 0) {
      const error: any = new Error(`Insufficient funds or wallet inactive for user: ${userId}`);
      error.statusCode = 400;
      error.errorCode = 'INSUFFICIENT_FUNDS';
      throw error;
    }
  }

  /**
   * Credit money to wallet (balance in Poisha)
   */
  async credit(userId: string, amount: number, client: PoolClient): Promise<void> {
    const res = await client.query(
      `UPDATE wallets 
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 
       RETURNING balance`,
      [amount, userId]
    );

    if (res.rowCount === 0) {
      const error: any = new Error(`Wallet not found for credit on user: ${userId}`);
      error.statusCode = 404;
      error.errorCode = 'WALLET_NOT_FOUND';
      throw error;
    }
  }
}

export const walletRepository = new PostgresWalletRepository();
export default walletRepository;
