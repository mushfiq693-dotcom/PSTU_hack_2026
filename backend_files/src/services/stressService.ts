import { pool } from '../config/db';
import { StressTestResult } from '../types';
import { TransferService } from './transferService';
import { LedgerService } from './ledgerService';
import { Logger } from '../utils/logger';

export interface RunStressTestOptions {
  senderId: string;
  receiverId: string;
  totalRequests: number;
  amountPerRequestBdt: number;
  startingBalanceBdt?: number;
  requestId?: string;
}

export class StressService {
  /**
   * Fires N concurrent transfer requests simultaneously against PostgreSQL with row locking.
   * Proves ACID transaction serialization, zero race conditions, zero double-spending,
   * and double-entry ledger balance integrity under high-concurrency connection pooling.
   */
  public static async runStressTest(options: RunStressTestOptions): Promise<StressTestResult> {
    const {
      senderId,
      receiverId,
      totalRequests = 20,
      amountPerRequestBdt = 500,
      startingBalanceBdt = 1000,
      requestId
    } = options;

    const amountPoisha = Math.round(amountPerRequestBdt * 100);
    const targetStartingBalancePoisha = Math.round(startingBalanceBdt * 100);

    Logger.info('CONCURRENCY', 'TEST_START', 'Launching parallel concurrency stress benchmark', {
      requestId,
      sender: senderId,
      receiver: receiverId,
      threads: totalRequests,
      amountPerRequestBdt: `৳${amountPerRequestBdt}`,
      startingBalanceBdt: `৳${startingBalanceBdt}`,
    });

    // 1. Prepare controlled starting balance for sender and receiver
    const senderWalletRes = await pool.query('SELECT id FROM wallets WHERE user_id = $1', [senderId]);
    const receiverWalletRes = await pool.query('SELECT id FROM wallets WHERE user_id = $1', [receiverId]);

    if (senderWalletRes.rows.length === 0 || receiverWalletRes.rows.length === 0) {
      Logger.warn('CONCURRENCY', 'TEST_ERROR', 'Sender or receiver wallet not found', {
        requestId,
        senderId,
        receiverId,
      });
      const error: any = new Error('Sender or Receiver wallet not found for stress test.');
      error.statusCode = 404;
      throw error;
    }

    const senderWalletId = senderWalletRes.rows[0].id;
    const receiverWalletId = receiverWalletRes.rows[0].id;

    // Set controlled starting balance for clean demonstration
    await pool.query(
      'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [targetStartingBalancePoisha, senderWalletId]
    );

    const initialSenderBalancePoisha = targetStartingBalancePoisha;
    const startTime = Date.now();

    // 2. Construct N concurrent transfer promises
    const promises: Promise<{
      req_index: number;
      status: 'SUCCESS' | 'REJECTED';
      status_code: number;
      error_code?: string;
      message: string;
      duration_ms: number;
    }>[] = [];

    for (let i = 1; i <= totalRequests; i++) {
      const task = async () => {
        const reqStart = Date.now();
        const transferId = `TRX-BURST-${i.toString().padStart(3, '0')}`;
        try {
          // Micro delay to stagger arrival slightly across worker threads
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));

          const res = await TransferService.executeTransfer({
            senderId,
            receiverId,
            amountPoisha,
            note: `Stress Test Concurrent Transfer #${i}`,
            category: 'Stress Simulation',
            type: 'TRANSFER',
            requestId: requestId ? `${requestId}_thread_${i}` : `thread_${i}`,
            transferId,
          });

          const durationMs = Date.now() - reqStart;
          return {
            req_index: i,
            status: 'SUCCESS' as const,
            status_code: 200,
            message: `Transfer #${i} succeeded (Ref: ${res.transaction.reference_id})`,
            duration_ms: durationMs
          };
        } catch (err: any) {
          const durationMs = Date.now() - reqStart;
          return {
            req_index: i,
            status: 'REJECTED' as const,
            status_code: err.statusCode || 400,
            error_code: err.errorCode || 'TRANSFER_FAILED',
            message: err.message || 'Transfer rejected',
            duration_ms: durationMs
          };
        }
      };

      promises.push(task());
    }

    // 3. Execute all requests concurrently
    const requestLogs = await Promise.all(promises);
    const executionDurationMs = Date.now() - startTime;

    // 4. Calculate Final State & Audit Checks
    const successfulCount = requestLogs.filter((r) => r.status === 'SUCCESS').length;
    const rejectedCount = requestLogs.filter((r) => r.status === 'REJECTED').length;

    const finalSenderWalletRes = await pool.query('SELECT balance FROM wallets WHERE id = $1', [senderWalletId]);
    const finalSenderBalance = Number(finalSenderWalletRes.rows[0].balance);

    const expectedSuccessfulCount = Math.floor(initialSenderBalancePoisha / amountPoisha);
    const expectedFinalSenderBalancePoisha = initialSenderBalancePoisha - successfulCount * amountPoisha;

    const doubleSpendDetected =
      successfulCount > expectedSuccessfulCount ||
      finalSenderBalance < 0 ||
      finalSenderBalance !== expectedFinalSenderBalancePoisha;

    // Run system audit
    const audit = await LedgerService.verifySystemAudit();

    // Rejection reason breakdown
    const rejectionBreakdown: Record<string, number> = {};
    for (const log of requestLogs) {
      if (log.status === 'REJECTED') {
        const code = log.error_code || 'OTHER';
        rejectionBreakdown[code] = (rejectionBreakdown[code] || 0) + 1;
      }
    }

    const totalRequestedBdt = (totalRequests * amountPoisha) / 100;
    const totalTransferredBdt = (successfulCount * amountPoisha) / 100;

    // Final Summary Log
    Logger.info('CONCURRENCY', 'TEST_COMPLETE', '', {
      requestId,
      threads: totalRequests,
      successful: successfulCount,
      blocked: rejectedCount,
      totalRequested: totalRequestedBdt,
      totalTransferred: totalTransferredBdt,
      duration: `${executionDurationMs}ms`,
      durationMs: executionDurationMs,
      doubleSpend: doubleSpendDetected ? 'DETECTED' : 'ZERO',
      ledgerBalanced: audit.is_balanced ? 'YES' : 'NO',
    });

    return {
      total_requests: totalRequests,
      successful_requests: successfulCount,
      rejected_requests: rejectedCount,
      amount_per_request_bdt: amountPerRequestBdt,
      starting_balance_bdt: startingBalanceBdt,
      expected_successful_count: expectedSuccessfulCount,
      final_sender_balance_bdt: finalSenderBalance / 100,
      double_spend_detected: doubleSpendDetected,
      ledger_balanced: audit.is_balanced,
      total_transferred_bdt: totalTransferredBdt,
      execution_duration_ms: executionDurationMs,
      discrepancy_bdt: audit.discrepancy_bdt,
      rejection_breakdown: rejectionBreakdown,
      request_logs: requestLogs.sort((a, b) => a.req_index - b.req_index)
    };
  }
}
