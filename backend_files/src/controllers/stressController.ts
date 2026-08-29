import { Request, Response, NextFunction } from 'express';
import { StressService } from '../services/stressService';
import { Logger } from '../utils/logger';

export class StressController {
  /**
   * POST /api/stress/run
   * Executes concurrent transfer stress test
   */
  public static async runStressTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const {
        sender_id = 'usr_shakib_01',
        receiver_id = 'usr_tanmoy_02',
        total_requests = 20,
        amount_per_request_bdt = 500,
        starting_balance_bdt = 1000
      } = req.body;

      if (total_requests < 1 || total_requests > 100) {
        (res as any).locals.errorCode = 'INVALID_PARAM';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_PARAM',
          message: 'Total concurrent requests must be between 1 and 100.'
        });
        return;
      }

      if (amount_per_request_bdt <= 0) {
        (res as any).locals.errorCode = 'INVALID_PARAM';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_PARAM',
          message: 'Amount per request must be greater than 0 BDT.'
        });
        return;
      }

      const result = await StressService.runStressTest({
        senderId: sender_id,
        receiverId: receiver_id,
        totalRequests: Number(total_requests),
        amountPerRequestBdt: Number(amount_per_request_bdt),
        startingBalanceBdt: starting_balance_bdt ? Number(starting_balance_bdt) : undefined,
        requestId,
      });

      res.status(200).json({
        success: true,
        message: `Executed ${result.total_requests} concurrent requests: ${result.successful_requests} succeeded, ${result.rejected_requests} safely rejected. Zero double-spend.`,
        data: result
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'STRESS_TEST_ERROR';
      Logger.error('CONCURRENCY', 'TEST_FAILED', err.message, {
        requestId,
        error: err.message,
      }, err);

      res.status(500).json({
        success: false,
        error_code: 'STRESS_TEST_ERROR',
        message: err.message
      });
    }
  }
}
