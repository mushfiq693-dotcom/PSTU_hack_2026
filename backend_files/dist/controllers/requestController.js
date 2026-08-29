"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestController = void 0;
const requestService_1 = require("../services/requestService");
class RequestController {
    /**
     * POST /api/requests
     * Create a new money request in PostgreSQL with optional borrow due date
     */
    static async create(req, res, next) {
        try {
            const requesterId = req.user.id;
            const { payer_id, payer_phone, amount_bdt, note, due_date } = req.body;
            if (!amount_bdt || typeof amount_bdt !== 'number' || amount_bdt <= 0) {
                res.status(400).json({
                    success: false,
                    error_code: 'INVALID_AMOUNT',
                    message: 'Please provide a valid positive amount in BDT.'
                });
                return;
            }
            const amountPoisha = Math.round(amount_bdt * 100);
            const request = await requestService_1.RequestService.createRequest({
                requesterId,
                payerId: payer_id,
                payerPhone: payer_phone,
                amountPoisha,
                note,
                dueDate: due_date
            });
            res.status(201).json({
                success: true,
                message: 'Money request created successfully.',
                data: request
            });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({
                success: false,
                error_code: err.errorCode || 'REQUEST_CREATE_ERROR',
                message: err.message
            });
        }
    }
    /**
     * GET /api/requests
     * List money requests (incoming, outgoing, or all) with computed overdue statuses
     */
    static async list(req, res, next) {
        try {
            const userId = req.user.id;
            const filter = req.query.filter || 'all';
            const requests = await requestService_1.RequestService.getRequests(userId, filter);
            res.status(200).json({
                success: true,
                data: requests
            });
        }
        catch (err) {
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
    static async accept(req, res, next) {
        try {
            const payerId = req.user.id;
            const requestId = req.params.id;
            const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']);
            const result = await requestService_1.RequestService.acceptRequest(requestId, payerId, idempotencyKey);
            res.status(200).json({
                success: true,
                message: 'Money request accepted and settled successfully.',
                data: result
            });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({
                success: false,
                error_code: err.errorCode || 'REQUEST_ACCEPT_ERROR',
                message: err.message
            });
        }
    }
    /**
     * POST /api/requests/:id/reject
     * Reject money request
     */
    static async reject(req, res, next) {
        try {
            const payerId = req.user.id;
            const requestId = req.params.id;
            const updatedRequest = await requestService_1.RequestService.rejectRequest(requestId, payerId);
            res.status(200).json({
                success: true,
                message: 'Money request rejected.',
                data: updatedRequest
            });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({
                success: false,
                error_code: err.errorCode || 'REQUEST_REJECT_ERROR',
                message: err.message
            });
        }
    }
    /**
     * POST /api/requests/:id/cancel
     * Cancel outgoing money request
     */
    static async cancel(req, res, next) {
        try {
            const requesterId = req.user.id;
            const requestId = req.params.id;
            const updatedRequest = await requestService_1.RequestService.cancelRequest(requestId, requesterId);
            res.status(200).json({
                success: true,
                message: 'Money request cancelled.',
                data: updatedRequest
            });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({
                success: false,
                error_code: err.errorCode || 'REQUEST_CANCEL_ERROR',
                message: err.message
            });
        }
    }
}
exports.RequestController = RequestController;
