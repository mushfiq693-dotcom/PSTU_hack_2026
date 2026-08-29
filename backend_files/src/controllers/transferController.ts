import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TransferService } from '../services/transferService';
import { UserService } from '../services/userService';

export class TransferController {
  /**
   * POST /api/transfers
   * Direct P2P transfer in PostgreSQL
   */
  public static async transfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user!.id;
      const { receiver_id, receiver_phone, amount_bdt, note, category } = req.body;

      if (!amount_bdt || typeof amount_bdt !== 'number' || amount_bdt <= 0) {
        res.status(400).json({
          success: false,
          error_code: 'INVALID_AMOUNT',
          message: 'Please provide a valid positive amount in BDT.'
        });
        return;
      }

      // Convert BDT to integer Poisha
      const amountPoisha = Math.round(amount_bdt * 100);
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

      const result = await TransferService.executeTransfer({
        senderId,
        receiverId: receiver_id,
        receiverPhone: receiver_phone,
        amountPoisha,
        note,
        category,
        type: 'TRANSFER',
        idempotencyKey
      });

      res.status(200).json({
        success: true,
        message: `Successfully transferred ৳${amount_bdt.toFixed(2)}`,
        data: result
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        error_code: err.errorCode || 'TRANSFER_ERROR',
        message: err.message || 'An unexpected error occurred during transfer.'
      });
    }
  }

  /**
   * GET /api/transfers/history
   * Transaction history for active user
   */
  public static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await UserService.getUserTransactions(userId, limit);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error_code: 'HISTORY_FETCH_ERROR',
        message: err.message
      });
    }
  }
}
