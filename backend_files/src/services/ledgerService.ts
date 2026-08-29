import { pool } from '../config/db';
import { LedgerAuditResult, LedgerEntry } from '../types';

export class LedgerService {
  /**
   * Retrieves paginated double-entry ledger entries for auditing from PostgreSQL
   */
  public static async getLedgerEntries(
    walletId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ entries: LedgerEntry[]; total: number }> {
    let countQuery = 'SELECT COUNT(*) as count FROM ledger_entries';
    let dataQuery = `
      SELECT 
        l.id,
        l.transaction_id,
        l.wallet_id,
        l.entry_type,
        l.amount,
        l.balance_after,
        l.created_at,
        u.name as user_name,
        u.phone as user_phone,
        t.reference_id,
        t.note,
        t.type as transaction_type
      FROM ledger_entries l
      JOIN wallets w ON l.wallet_id = w.id
      JOIN users u ON w.user_id = u.id
      JOIN transactions t ON l.transaction_id = t.id
    `;

    const params: any[] = [];
    if (walletId) {
      countQuery += ' WHERE l.wallet_id = $1';
      dataQuery += ' WHERE l.wallet_id = $1';
      params.push(walletId);
    }

    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;

    dataQuery += ` ORDER BY l.created_at DESC, l.id DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`;

    const countRes = await pool.query(countQuery, walletId ? [walletId] : []);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataRes = await pool.query(dataQuery, [...params, limit, offset]);
    const entries = dataRes.rows as LedgerEntry[];

    return { entries, total };
  }

  /**
   * Live Mathematical Verification of the Financial Ledger in PostgreSQL
   * Checks the fundamental financial invariant: SUM(Debits) - SUM(Credits) === 0
   */
  public static async verifySystemAudit(): Promise<LedgerAuditResult> {
    const debitRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_debit, COUNT(*) as count 
      FROM ledger_entries 
      WHERE entry_type = 'DEBIT'
    `);

    const creditRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_credit, COUNT(*) as count 
      FROM ledger_entries 
      WHERE entry_type = 'CREDIT'
    `);

    const totalDebitPoisha = Number(debitRes.rows[0].total_debit);
    const totalCreditPoisha = Number(creditRes.rows[0].total_credit);
    const discrepancyPoisha = totalDebitPoisha - totalCreditPoisha;

    const totalWalletsRes = await pool.query(`
      SELECT COALESCE(SUM(balance), 0) as total_balance 
      FROM wallets 
      WHERE user_id != 'usr_system_treasury'
    `);

    const totalTransactionsRes = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const totalTransactions = parseInt(totalTransactionsRes.rows[0].count, 10);
    const totalLedgerEntries = parseInt(debitRes.rows[0].count, 10) + parseInt(creditRes.rows[0].count, 10);

    const isBalanced = discrepancyPoisha === 0;

    return {
      total_debit_poisha: totalDebitPoisha,
      total_credit_poisha: totalCreditPoisha,
      total_debit_bdt: totalDebitPoisha / 100,
      total_credit_bdt: totalCreditPoisha / 100,
      discrepancy_poisha: discrepancyPoisha,
      discrepancy_bdt: discrepancyPoisha / 100,
      is_balanced: isBalanced,
      total_ledger_entries: totalLedgerEntries,
      total_transactions: totalTransactions,
      total_system_wallets_balance_bdt: Number(totalWalletsRes.rows[0].total_balance) / 100,
      system_integrity_status: isBalanced ? 'HEALTHY_BALANCED' : 'DISCREPANCY_DETECTED',
      audited_at: new Date().toISOString()
    };
  }
}
