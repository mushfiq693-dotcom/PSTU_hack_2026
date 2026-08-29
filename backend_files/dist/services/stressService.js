"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StressService = void 0;
const db_1 = require("../config/db");
const transferService_1 = require("./transferService");
const ledgerService_1 = require("./ledgerService");
class StressService {
    /**
     * Fires N concurrent transfer requests simultaneously against PostgreSQL with row locking.
     * Proves ACID transaction serialization, zero race conditions, zero double-spending,
     * and double-entry ledger balance integrity under high-concurrency connection pooling.
     */
    static async runStressTest(options) {
        const { senderId, receiverId, totalRequests = 20, amountPerRequestBdt = 500, startingBalanceBdt = 1000 } = options;
        const amountPoisha = Math.round(amountPerRequestBdt * 100);
        const targetStartingBalancePoisha = Math.round(startingBalanceBdt * 100);
        // 1. Prepare controlled starting balance for sender and receiver
        const senderWalletRes = await db_1.pool.query('SELECT id FROM wallets WHERE user_id = $1', [senderId]);
        const receiverWalletRes = await db_1.pool.query('SELECT id FROM wallets WHERE user_id = $1', [receiverId]);
        if (senderWalletRes.rows.length === 0 || receiverWalletRes.rows.length === 0) {
            const error = new Error('Sender or Receiver wallet not found for stress test.');
            error.statusCode = 404;
            throw error;
        }
        const senderWalletId = senderWalletRes.rows[0].id;
        const receiverWalletId = receiverWalletRes.rows[0].id;
        // Set controlled starting balance for clean demonstration
        await db_1.pool.query('UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [targetStartingBalancePoisha, senderWalletId]);
        const initialSenderBalancePoisha = targetStartingBalancePoisha;
        const startTime = Date.now();
        // 2. Construct N concurrent transfer promises
        const promises = [];
        for (let i = 1; i <= totalRequests; i++) {
            const task = async () => {
                const reqStart = Date.now();
                try {
                    // Micro delay to stagger arrival slightly across worker threads
                    await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
                    const res = await transferService_1.TransferService.executeTransfer({
                        senderId,
                        receiverId,
                        amountPoisha,
                        note: `Stress Test Concurrent Transfer #${i}`,
                        category: 'Stress Simulation',
                        type: 'TRANSFER'
                    });
                    const durationMs = Date.now() - reqStart;
                    return {
                        req_index: i,
                        status: 'SUCCESS',
                        status_code: 200,
                        message: `Transfer #${i} succeeded (Ref: ${res.transaction.reference_id})`,
                        duration_ms: durationMs
                    };
                }
                catch (err) {
                    const durationMs = Date.now() - reqStart;
                    return {
                        req_index: i,
                        status: 'REJECTED',
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
        const finalSenderWalletRes = await db_1.pool.query('SELECT balance FROM wallets WHERE id = $1', [senderWalletId]);
        const finalSenderBalance = Number(finalSenderWalletRes.rows[0].balance);
        const expectedSuccessfulCount = Math.floor(initialSenderBalancePoisha / amountPoisha);
        const expectedFinalSenderBalancePoisha = initialSenderBalancePoisha - successfulCount * amountPoisha;
        const doubleSpendDetected = successfulCount > expectedSuccessfulCount ||
            finalSenderBalance < 0 ||
            finalSenderBalance !== expectedFinalSenderBalancePoisha;
        // Run system audit
        const audit = await ledgerService_1.LedgerService.verifySystemAudit();
        // Rejection reason breakdown
        const rejectionBreakdown = {};
        for (const log of requestLogs) {
            if (log.status === 'REJECTED') {
                const code = log.error_code || 'OTHER';
                rejectionBreakdown[code] = (rejectionBreakdown[code] || 0) + 1;
            }
        }
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
            total_transferred_bdt: (successfulCount * amountPoisha) / 100,
            execution_duration_ms: executionDurationMs,
            discrepancy_bdt: audit.discrepancy_bdt,
            rejection_breakdown: rejectionBreakdown,
            request_logs: requestLogs.sort((a, b) => a.req_index - b.req_index)
        };
    }
}
exports.StressService = StressService;
