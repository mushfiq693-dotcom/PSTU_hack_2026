"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const transferService_1 = require("../services/transferService");
const userService_1 = require("../services/userService");
class TransferController {
    /**
     * POST /api/transfers
     * Direct P2P transfer in PostgreSQL
     */
    static async transfer(req, res, next) {
        try {
            const senderId = req.user.id;
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
            const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']);
            const result = await transferService_1.TransferService.executeTransfer({
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
        }
        catch (err) {
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
    static async getHistory(req, res, next) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 50;
            const history = await userService_1.UserService.getUserTransactions(userId, limit);
            res.status(200).json({
                success: true,
                data: history
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error_code: 'HISTORY_FETCH_ERROR',
                message: err.message
            });
        }
    }
}
exports.TransferController = TransferController;
