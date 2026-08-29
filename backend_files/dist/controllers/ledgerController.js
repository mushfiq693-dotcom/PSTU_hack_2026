"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerController = void 0;
const ledgerService_1 = require("../services/ledgerService");
class LedgerController {
    /**
     * GET /api/ledger/entries
     * Retrieve paginated double-entry ledger entries from PostgreSQL
     */
    static async getEntries(req, res, next) {
        try {
            const walletId = req.query.wallet_id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const result = await ledgerService_1.LedgerService.getLedgerEntries(walletId, limit, offset);
            res.status(200).json({
                success: true,
                data: result.entries,
                meta: {
                    total: result.total,
                    limit,
                    offset
                }
            });
        }
        catch (err) {
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
    static async audit(req, res, next) {
        try {
            const auditResult = await ledgerService_1.LedgerService.verifySystemAudit();
            res.status(200).json({
                success: true,
                data: auditResult
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error_code: 'AUDIT_EXECUTION_ERROR',
                message: err.message
            });
        }
    }
}
exports.LedgerController = LedgerController;
