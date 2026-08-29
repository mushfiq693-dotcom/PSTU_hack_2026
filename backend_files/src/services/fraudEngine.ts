/**
 * ==============================================================================
 * FastPay Real-Time Fraud Detection & Risk Scoring Engine
 * ==============================================================================
 * Multi-layer heuristic & behavioral fraud assessment pipeline:
 *  1. Velocity Check (Rapid burst transfers within rolling window)
 *  2. Extreme Amount Anomaly Check (High-value transfers exceeding safe threshold)
 *  3. Account Drain Attack Prevention (Transferring 100% balance in a single burst)
 *  4. New Recipient Risk Assessment
 * ==============================================================================
 */

import { pool } from '../config/db';
import { Logger } from '../utils/logger';

export interface FraudEvaluationResult {
  isBlocked: boolean;
  requiresStepUpOtp: boolean;
  riskScore: number; // 0 (Zero Risk) to 100 (Critical Fraud Risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  recommendation: 'ALLOW' | 'CHALLENGE_OTP' | 'BLOCK';
}

export class FraudEngine {
  // Threshold constants (in Poisha)
  private static readonly HIGH_VALUE_THRESHOLD_POISHA = 2500000; // ৳25,000
  private static readonly CRITICAL_VALUE_THRESHOLD_POISHA = 5000000; // ৳50,000
  private static readonly VELOCITY_TIME_WINDOW_SEC = 60; // 60 seconds window
  private static readonly MAX_TRANSFERS_PER_WINDOW = 5;

  /**
   * Evaluates a transfer request against real-time anti-fraud rules
   */
  public static async evaluateTransfer(params: {
    senderId: string;
    receiverId: string;
    amountPoisha: number;
    currentBalancePoisha: number;
    requestId?: string;
    client?: any;
  }): Promise<FraudEvaluationResult> {
    const { senderId, receiverId, amountPoisha, currentBalancePoisha, requestId, client } = params;
    const db = client || pool;
    const riskFactors: string[] = [];
    let riskScore = 5; // Baseline trust score

    // -------------------------------------------------------------
    // RULE 1: Velocity Check (Burst Transfer Detection)
    // -------------------------------------------------------------
    const velocityRes = await db.query(
      `SELECT COUNT(*)::int as recent_count, COALESCE(SUM(amount), 0)::bigint as recent_sum
       FROM transactions t
       JOIN wallets w ON t.sender_wallet_id = w.id
       WHERE w.user_id = $1 
         AND t.created_at >= NOW() - INTERVAL '60 seconds'
         AND t.status = 'SUCCESS'`,
      [senderId]
    );

    const recentTxCount = velocityRes.rows[0]?.recent_count || 0;

    if (recentTxCount >= this.MAX_TRANSFERS_PER_WINDOW) {
      riskScore += 60;
      riskFactors.push(`Critical Transaction Velocity (${recentTxCount} transfers in 60s)`);
    } else if (recentTxCount >= 3) {
      riskScore += 30;
      riskFactors.push(`Elevated Transaction Velocity (${recentTxCount} transfers in 60s)`);
    }

    // -------------------------------------------------------------
    // RULE 2: Amount Anomaly & Large Outflow Analysis
    // -------------------------------------------------------------
    if (amountPoisha >= this.CRITICAL_VALUE_THRESHOLD_POISHA) {
      riskScore += 75; // ৳50,000+ brings score to 80+ (instant block)
      riskFactors.push(`Critical High-Value Transfer Anomaly (৳${(amountPoisha / 100).toLocaleString()})`);
    } else if (amountPoisha >= this.HIGH_VALUE_THRESHOLD_POISHA) {
      riskScore += 35;
      riskFactors.push(`High-Value Transfer Flag (৳${(amountPoisha / 100).toLocaleString()})`);
    }

    // -------------------------------------------------------------
    // RULE 3: Total Account Drain Pattern
    // -------------------------------------------------------------
    if (currentBalancePoisha > 0 && amountPoisha >= currentBalancePoisha * 0.90 && amountPoisha > 1000000) {
      riskScore += 30;
      riskFactors.push('Wallet Liquidation Pattern (>90% balance outflow)');
    }

    // -------------------------------------------------------------
    // RULE 4: First-Time Transfer Recipient Verification
    // -------------------------------------------------------------
    const historyRes = await db.query(
      `SELECT COUNT(*)::int as tx_count
       FROM transactions t
       JOIN wallets sw ON t.sender_wallet_id = sw.id
       JOIN wallets rw ON t.receiver_wallet_id = rw.id
       WHERE sw.user_id = $1 AND rw.user_id = $2 AND t.status = 'SUCCESS'`,
      [senderId, receiverId]
    );

    const priorTransfers = historyRes.rows[0]?.tx_count || 0;
    if (priorTransfers === 0 && amountPoisha > 1000000) {
      riskScore += 20;
      riskFactors.push('First-Time High-Value Recipient');
    }

    // Normalize risk score to 0 - 100 range
    riskScore = Math.min(100, Math.max(0, riskScore));

    // Determine Risk Level & Action Recommendation
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let recommendation: 'ALLOW' | 'CHALLENGE_OTP' | 'BLOCK' = 'ALLOW';
    let isBlocked = false;
    let requiresStepUpOtp = false;

    if (riskScore >= 70) {
      riskLevel = 'CRITICAL';
      recommendation = 'BLOCK';
      isBlocked = true;
    } else if (riskScore >= 45) {
      riskLevel = 'HIGH';
      recommendation = 'CHALLENGE_OTP';
      requiresStepUpOtp = true;
    } else if (riskScore >= 25) {
      riskLevel = 'MEDIUM';
      recommendation = 'ALLOW';
    }

    Logger.info('SECURITY', 'FRAUD_EVALUATION', 'Real-time transfer fraud evaluation completed', {
      requestId,
      senderId,
      receiverId,
      amountBdt: `৳${(amountPoisha / 100).toFixed(2)}`,
      riskScore,
      riskLevel,
      recommendation,
      riskFactorsCount: riskFactors.length,
      riskFactors,
    });

    return {
      isBlocked,
      requiresStepUpOtp,
      riskScore,
      riskLevel,
      riskFactors,
      recommendation,
    };
  }
}
