import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { RequestService } from '../services/requestService';
import { Logger } from '../utils/logger';

export class RequestController {
  /**
   * POST /api/requests
   * Create a new money request in PostgreSQL with optional borrow due date
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const requesterId = req.user!.id;
      const { payer_id, payer_phone, amount_bdt, note, due_date } = req.body;

      if (!amount_bdt || typeof amount_bdt !== 'number' || amount_bdt <= 0) {
        (res as any).locals.errorCode = 'INVALID_AMOUNT';
        res.status(400).json({
          success: false,
          error_code: 'INVALID_AMOUNT',
          message: 'Please provide a valid positive amount in BDT.'
        });
        return;
      }

      const amountPoisha = Math.round(amount_bdt * 100);
      const request = await RequestService.createRequest({
        requesterId,
        payerId: payer_id,
        payerPhone: payer_phone,
        amountPoisha,
        note,
        dueDate: due_date,
        requestId,
      });

      res.status(201).json({
        success: true,
        message: 'Money request created successfully.',
        data: request
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'REQUEST_CREATE_ERROR';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message
      });
    }
  }

  /**
   * GET /api/requests
   * List money requests (incoming, outgoing, or all) with computed overdue statuses
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const userId = req.user!.id;
      const filter = (req.query.filter as 'incoming' | 'outgoing' | 'all') || 'all';
      const requests = await RequestService.getRequests(userId, filter);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'REQUEST_LIST_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'REQUEST_LIST_ERROR',
        message: err.message
      });
    }
  }

  /**
   * POST /api/requests/:id/accept
   * Accept and settle money request via TransferService
   */
  public static async accept(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const payerId = req.user!.id;
      const moneyRequestId = req.params.id;
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

      const result = await RequestService.acceptRequest(moneyRequestId, payerId, idempotencyKey, requestId);

      res.status(200).json({
        success: true,
        message: 'Money request accepted and settled successfully.',
        data: result
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'REQUEST_ACCEPT_ERROR';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message
      });
    }
  }

  /**
   * POST /api/requests/:id/reject
   * Reject money request
   */
  public static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const payerId = req.user!.id;
      const moneyRequestId = req.params.id;

      const updatedRequest = await RequestService.rejectRequest(moneyRequestId, payerId, requestId);

      res.status(200).json({
        success: true,
        message: 'Money request rejected.',
        data: updatedRequest
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'REQUEST_REJECT_ERROR';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message
      });
    }
  }

  /**
   * POST /api/requests/:id/cancel
   * Cancel outgoing money request
   */
  public static async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = req.requestId;
    try {
      const requesterId = req.user!.id;
      const moneyRequestId = req.params.id;

      const updatedRequest = await RequestService.cancelRequest(moneyRequestId, requesterId, requestId);

      res.status(200).json({
        success: true,
        message: 'Money request cancelled.',
        data: updatedRequest
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'REQUEST_CANCEL_ERROR';
      (res as any).locals.errorCode = errorCode;

      res.status(statusCode).json({
        success: false,
        error_code: errorCode,
        message: err.message
      });
    }
  }
}
