"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestService = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const transferService_1 = require("./transferService");
class RequestService {
    /**
     * Create a new P2P Money Request in PostgreSQL
     */
    static async createRequest(params) {
        const { requesterId, payerId: initialPayerId, payerPhone, amountPoisha, note } = params;
        if (!amountPoisha || amountPoisha <= 0 || !Number.isInteger(amountPoisha)) {
            const error = new Error('Request amount must be a positive integer in Poisha.');
            error.statusCode = 400;
            error.errorCode = 'INVALID_AMOUNT';
            throw error;
        }
        let resolvedPayerId = initialPayerId;
        if (!resolvedPayerId && payerPhone) {
            const payerUser = await db_1.pool.query('SELECT id FROM users WHERE phone = $1', [payerPhone]);
            if (payerUser.rows.length === 0) {
                const error = new Error(`User with phone '${payerPhone}' not found.`);
                error.statusCode = 404;
                error.errorCode = 'PAYER_NOT_FOUND';
                throw error;
            }
            resolvedPayerId = payerUser.rows[0].id;
        }
        if (!resolvedPayerId) {
            const error = new Error('Payer user ID or phone number is required.');
            error.statusCode = 400;
            error.errorCode = 'PAYER_REQUIRED';
            throw error;
        }
        if (requesterId === resolvedPayerId) {
            const error = new Error('You cannot send a money request to yourself.');
            error.statusCode = 400;
            error.errorCode = 'SELF_REQUEST_PROHIBITED';
            throw error;
        }
        const requestId = (0, uuid_1.v4)();
        await db_1.pool.query(`INSERT INTO money_requests (id, requester_id, payer_id, amount, note, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)`, [requestId, requesterId, resolvedPayerId, amountPoisha, note || null]);
        const request = await this.getRequestById(requestId);
        return request;
    }
    /**
     * Retrieve a single Money Request with user details
     */
    static async getRequestById(requestId) {
        const res = await db_1.pool.query(`SELECT 
        mr.*,
        ru.name as requester_name,
        ru.phone as requester_phone,
        ru.avatar as requester_avatar,
        pu.name as payer_name,
        pu.phone as payer_phone,
        pu.avatar as payer_avatar
      FROM money_requests mr
      JOIN users ru ON mr.requester_id = ru.id
      JOIN users pu ON mr.payer_id = pu.id
      WHERE mr.id = $1`, [requestId]);
        return res.rows[0] || null;
    }
    /**
     * List money requests for a user (incoming, outgoing, or all)
     */
    static async getRequests(userId, filter = 'all') {
        let queryText = `
      SELECT 
        mr.*,
        ru.name as requester_name,
        ru.phone as requester_phone,
        ru.avatar as requester_avatar,
        pu.name as payer_name,
        pu.phone as payer_phone,
        pu.avatar as payer_avatar
      FROM money_requests mr
      JOIN users ru ON mr.requester_id = ru.id
      JOIN users pu ON mr.payer_id = pu.id
    `;
        const params = [];
        if (filter === 'incoming') {
            queryText += ' WHERE mr.payer_id = $1';
            params.push(userId);
        }
        else if (filter === 'outgoing') {
            queryText += ' WHERE mr.requester_id = $1';
            params.push(userId);
        }
        else {
            queryText += ' WHERE mr.payer_id = $1 OR mr.requester_id = $2';
            params.push(userId, userId);
        }
        queryText += ' ORDER BY mr.created_at DESC';
        const res = await db_1.pool.query(queryText, params);
        return res.rows;
    }
    /**
     * Accept and Settle a Money Request in PostgreSQL
     * Routes money movement through the central TransferService!
     */
    static async acceptRequest(requestId, payerId, idempotencyKey) {
        const request = await this.getRequestById(requestId);
        if (!request) {
            const error = new Error('Money request not found.');
            error.statusCode = 404;
            error.errorCode = 'REQUEST_NOT_FOUND';
            throw error;
        }
        if (request.payer_id !== payerId) {
            const error = new Error('Only the designated payer can accept this money request.');
            error.statusCode = 403;
            error.errorCode = 'FORBIDDEN_ACTION';
            throw error;
        }
        if (request.status !== 'PENDING') {
            const error = new Error(`Money request is already ${request.status.toLowerCase()}.`);
            error.statusCode = 400;
            error.errorCode = 'REQUEST_ALREADY_RESOLVED';
            throw error;
        }
        // 1. Execute Fund Transfer using Central Transfer Engine (Row-level locked & atomic)
        const transferResult = await transferService_1.TransferService.executeTransfer({
            senderId: payerId,
            receiverId: request.requester_id,
            amountPoisha: Number(request.amount),
            note: `Request Settlement: ${request.note || 'P2P Payment'}`,
            category: 'Request Settlement',
            type: 'REQUEST_SETTLEMENT',
            idempotencyKey
        });
        // 2. Mark request as ACCEPTED and link transaction ID
        await db_1.pool.query(`UPDATE money_requests 
       SET status = 'ACCEPTED', transaction_id = $1, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2`, [transferResult.transaction.id, requestId]);
        const updatedRequest = (await this.getRequestById(requestId));
        return {
            request: updatedRequest,
            transfer: transferResult
        };
    }
    /**
     * Reject a Money Request
     */
    static async rejectRequest(requestId, payerId) {
        const request = await this.getRequestById(requestId);
        if (!request) {
            const error = new Error('Money request not found.');
            error.statusCode = 404;
            error.errorCode = 'REQUEST_NOT_FOUND';
            throw error;
        }
        if (request.payer_id !== payerId) {
            const error = new Error('Only the designated payer can decline this money request.');
            error.statusCode = 403;
            error.errorCode = 'FORBIDDEN_ACTION';
            throw error;
        }
        if (request.status !== 'PENDING') {
            const error = new Error(`Money request is already ${request.status.toLowerCase()}.`);
            error.statusCode = 400;
            error.errorCode = 'REQUEST_ALREADY_RESOLVED';
            throw error;
        }
        await db_1.pool.query(`UPDATE money_requests 
       SET status = 'REJECTED', resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $1`, [requestId]);
        return (await this.getRequestById(requestId));
    }
    /**
     * Cancel an Outgoing Money Request
     */
    static async cancelRequest(requestId, requesterId) {
        const request = await this.getRequestById(requestId);
        if (!request) {
            const error = new Error('Money request not found.');
            error.statusCode = 404;
            error.errorCode = 'REQUEST_NOT_FOUND';
            throw error;
        }
        if (request.requester_id !== requesterId) {
            const error = new Error('Only the requester can cancel this money request.');
            error.statusCode = 403;
            error.errorCode = 'FORBIDDEN_ACTION';
            throw error;
        }
        if (request.status !== 'PENDING') {
            const error = new Error(`Money request is already ${request.status.toLowerCase()}.`);
            error.statusCode = 400;
            error.errorCode = 'REQUEST_ALREADY_RESOLVED';
            throw error;
        }
        await db_1.pool.query(`UPDATE money_requests 
       SET status = 'CANCELLED', resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $1`, [requestId]);
        return (await this.getRequestById(requestId));
    }
}
exports.RequestService = RequestService;
