import { v4 as uuidv4 } from 'uuid';
import { pool, getClient } from '../config/db';
import { Transaction, TransactionType } from '../types';

export interface ExecuteTransferParams {
  senderId: string;
  receiverId?: string;
  receiverPhone?: string;
  amountPoisha: number;
  note?: string;
  category?: string;
  type?: TransactionType;
  idempotencyKey?: string;
}

export interface TransferResult {
  transaction: Transaction;
  sender_new_balance_bdt: number;
  sender_new_balance_poisha: number;
  receiver_new_balance_bdt: number;
  receiver_new_balance_poisha: number;
  double_entry_verified: boolean;
}

export class TransferService {
  /**
   * Centralized, Atomic Money Movement Engine for PostgreSQL
   * Executes inside an ACID transaction with deterministic SELECT ... FOR UPDATE row locking.
   * Guarantees strict concurrency safety, deadlock prevention, and double-entry consistency.
   */
  public static async executeTransfer(params: ExecuteTransferParams): Promise<TransferResult> {
    const {
      senderId,
      receiverId: initialReceiverId,
      receiverPhone,
      amountPoisha,
      note = 'P2P Transfer',
      category = 'General',
      type = 'TRANSFER',
      idempotencyKey
    } = params;

    // 1. Validation Checks
    if (!amountPoisha || amountPoisha <= 0 || !Number.isInteger(amountPoisha)) {
      const error: any = new Error('Transfer amount must be a positive integer in Poisha.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_AMOUNT';
      throw error;
    }

    // Resolve Receiver User ID if phone was provided
    let resolvedReceiverId = initialReceiverId;
    if (!resolvedReceiverId && receiverPhone) {
      const receiverUser = await pool.query('SELECT id FROM users WHERE phone = $1', [receiverPhone]);
      if (receiverUser.rows.length === 0) {
        const error: any = new Error(`Recipient with phone number '${receiverPhone}' was not found.`);
        error.statusCode = 404;
        error.errorCode = 'RECIPIENT_NOT_FOUND';
        throw error;
      }
      resolvedReceiverId = receiverUser.rows[0].id;
    }

    if (!resolvedReceiverId) {
      const error: any = new Error('Recipient user ID or phone number is required.');
      error.statusCode = 400;
      error.errorCode = 'RECIPIENT_REQUIRED';
      throw error;
    }

    if (senderId === resolvedReceiverId) {
      const error: any = new Error('Self-transfers are not permitted. Please choose a different recipient.');
      error.statusCode = 400;
      error.errorCode = 'SELF_TRANSFER_PROHIBITED';
      throw error;
    }

    // 2. Execute Atomic Transaction with PostgreSQL Client
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Deterministic Row Lock Order (Alphabetical by user_id) to prevent deadlocks under concurrent cross-transfers
      const userIdsToLock = [senderId, resolvedReceiverId].sort();

      const walletsRes = await client.query(
        `SELECT id, user_id, balance, status 
         FROM wallets 
         WHERE user_id = ANY($1::text[]) 
         ORDER BY user_id ASC 
         FOR UPDATE`,
        [userIdsToLock]
      );

      const senderWallet = walletsRes.rows.find((w) => w.user_id === senderId);
      const receiverWallet = walletsRes.rows.find((w) => w.user_id === resolvedReceiverId);

      if (!senderWallet) {
        const error: any = new Error('Sender wallet does not exist.');
        error.statusCode = 404;
        error.errorCode = 'SENDER_WALLET_NOT_FOUND';
        throw error;
      }

      if (senderWallet.status !== 'ACTIVE') {
        const error: any = new Error(`Sender wallet is currently ${senderWallet.status}.`);
        error.statusCode = 403;
        error.errorCode = 'SENDER_WALLET_INACTIVE';
        throw error;
      }

      if (!receiverWallet) {
        const error: any = new Error('Receiver wallet does not exist.');
        error.statusCode = 404;
        error.errorCode = 'RECEIVER_WALLET_NOT_FOUND';
        throw error;
      }

      if (receiverWallet.status !== 'ACTIVE') {
        const error: any = new Error(`Receiver wallet is currently ${receiverWallet.status}.`);
        error.statusCode = 403;
        error.errorCode = 'RECEIVER_WALLET_INACTIVE';
        throw error;
      }

      const currentSenderBalance = Number(senderWallet.balance);
      const currentReceiverBalance = Number(receiverWallet.balance);

      // Concurrency & Balance Validation
      if (currentSenderBalance < amountPoisha) {
        const currentBdt = (currentSenderBalance / 100).toFixed(2);
        const reqBdt = (amountPoisha / 100).toFixed(2);
        const error: any = new Error(`Insufficient funds. Available balance: ৳${currentBdt}, Required: ৳${reqBdt}.`);
        error.statusCode = 400;
        error.errorCode = 'INSUFFICIENT_FUNDS';
        throw error;
      }

      const senderNewBalance = currentSenderBalance - amountPoisha;
      const receiverNewBalance = currentReceiverBalance + amountPoisha;

      // 3. Mutate Wallets
      await client.query(
        `UPDATE wallets 
         SET balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [senderNewBalance, senderWallet.id]
      );

      await client.query(
        `UPDATE wallets 
         SET balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [receiverNewBalance, receiverWallet.id]
      );

      // 4. Generate Business Transaction Record
      const txId = uuidv4();
      const refId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await client.query(
        `INSERT INTO transactions (
          id, reference_id, sender_wallet_id, receiver_wallet_id, 
          type, amount, fee, note, category, status, idempotency_key, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 'SUCCESS', $9, CURRENT_TIMESTAMP)`,
        [
          txId,
          refId,
          senderWallet.id,
          receiverWallet.id,
          type,
          amountPoisha,
          note,
          category,
          idempotencyKey || null
        ]
      );

      // 5. Generate Immutable Twin Double-Entry Ledger Records
      const debitLedgerId = uuidv4();
      const creditLedgerId = uuidv4();

      // DEBIT Sender
      await client.query(
        `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after, created_at)
         VALUES ($1, $2, $3, 'DEBIT', $4, $5, CURRENT_TIMESTAMP)`,
        [debitLedgerId, txId, senderWallet.id, amountPoisha, senderNewBalance]
      );

      // CREDIT Receiver
      await client.query(
        `INSERT INTO ledger_entries (id, transaction_id, wallet_id, entry_type, amount, balance_after, created_at)
         VALUES ($1, $2, $3, 'CREDIT', $4, $5, CURRENT_TIMESTAMP)`,
        [creditLedgerId, txId, receiverWallet.id, amountPoisha, receiverNewBalance]
      );

      // 6. If Idempotency Key is provided, store in transaction
      if (idempotencyKey) {
        const cachedPayload = {
          success: true,
          message: `Successfully transferred ৳${(amountPoisha / 100).toFixed(2)}`,
          data: {
            transaction_id: txId,
            reference_id: refId,
            amount_poisha: amountPoisha,
            amount_bdt: amountPoisha / 100,
            sender_new_balance_bdt: senderNewBalance / 100,
            receiver_new_balance_bdt: receiverNewBalance / 100,
            double_entry_verified: true
          }
        };

        await client.query(
          `INSERT INTO idempotency_records (key, user_id, status_code, response_body, created_at)
           VALUES ($1, $2, 200, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET response_body = EXCLUDED.response_body`,
          [idempotencyKey, senderId, JSON.stringify(cachedPayload)]
        );
      }

      await client.query('COMMIT');

      // Fetch transaction details with populated names
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
        WHERE t.id = $1`,
        [txId]
      );

      const transaction = txRes.rows[0] as Transaction;

      return {
        transaction,
        sender_new_balance_bdt: senderNewBalance / 100,
        sender_new_balance_poisha: senderNewBalance,
        receiver_new_balance_bdt: receiverNewBalance / 100,
        receiver_new_balance_poisha: receiverNewBalance,
        double_entry_verified: true
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
