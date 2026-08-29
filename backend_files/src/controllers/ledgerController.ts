import { Request, Response, NextFunction } from 'express';
import { LedgerService } from '../services/ledgerService';

export class LedgerController {
  /**
   * GET /api/ledger/entries
   * Retrieve paginated double-entry ledger entries from PostgreSQL
   */
  public static async getEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletId = req.query.wallet_id as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await LedgerService.getLedgerEntries(walletId, limit, offset);

      res.status(200).json({
        success: true,
        data: result.entries,
        meta: {
          total: result.total,
          limit,
          offset
        }
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'LEDGER_FETCH_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'LEDGER_FETCH_ERROR',
        message: err.message
      });
    }
  }

  /**
   * GET /api/ledger/audit
   * Run live mathematical integrity verification in PostgreSQL
   */
  public static async audit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auditResult = await LedgerService.verifySystemAudit();

      res.status(200).json({
        success: true,
        data: auditResult
      });
    } catch (err: any) {
      (res as any).locals.errorCode = 'AUDIT_EXECUTION_ERROR';
      res.status(500).json({
        success: false,
        error_code: 'AUDIT_EXECUTION_ERROR',
        message: err.message
      });
    }
  }
}
