import { v4 as uuidv4 } from 'uuid';
import { pool, getClient } from '../config/db';
import { MoneyRequest } from '../types';
import { TransferService, TransferResult } from './transferService';

export interface CreateRequestParams {
  requesterId: string;
  payerId?: string;
  payerPhone?: string;
  amountPoisha: number;
  note?: string;
}

export class RequestService {
  /**
   * Create a new P2P Money Request in PostgreSQL
   */
  public static async createRequest(params: CreateRequestParams): Promise<MoneyRequest> {
    const { requesterId, payerId: initialPayerId, payerPhone, amountPoisha, note } = params;

    if (!amountPoisha || amountPoisha <= 0 || !Number.isInteger(amountPoisha)) {
      const error: any = new Error('Request amount must be a positive integer in Poisha.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_AMOUNT';
      throw error;
    }

    let resolvedPayerId = initialPayerId;
    if (!resolvedPayerId && payerPhone) {
      const payerUser = await pool.query('SELECT id FROM users WHERE phone = $1', [payerPhone]);
      if (payerUser.rows.length === 0) {
        const error: any = new Error(`User with phone '${payerPhone}' not found.`);
        error.statusCode = 404;
        error.errorCode = 'PAYER_NOT_FOUND';
        throw error;
      }
      resolvedPayerId = payerUser.rows[0].id;
    }

    if (!resolvedPayerId) {
      const error: any = new Error('Payer user ID or phone number is required.');
      error.statusCode = 400;
      error.errorCode = 'PAYER_REQUIRED';
      throw error;
    }

    if (requesterId === resolvedPayerId) {
      const error: any = new Error('You cannot send a money request to yourself.');
      error.statusCode = 400;
      error.errorCode = 'SELF_REQUEST_PROHIBITED';
      throw error;
    }

    const requestId = uuidv4();
    await pool.query(
      `INSERT INTO money_requests (id, requester_id, payer_id, amount, note, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)`,
      [requestId, requesterId, resolvedPayerId, amountPoisha, note || null]
    );

    const request = await this.getRequestById(requestId);
    return request!;
  }

  /**
   * Retrieve a single Money Request with user details
   */
  public static async getRequestById(requestId: string): Promise<MoneyRequest | null> {
    const res = await pool.query(
      `SELECT 
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
      WHERE mr.id = $1`,
      [requestId]
    );

    return (res.rows[0] as MoneyRequest) || null;
  }

  /**
   * List money requests for a user (incoming, outgoing, or all)
   */
  public static async getRequests(
    userId: string,
    filter: 'incoming' | 'outgoing' | 'all' = 'all'
  ): Promise<MoneyRequest[]> {
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

    const params: any[] = [];
    if (filter === 'incoming') {
      queryText += ' WHERE mr.payer_id = $1';
      params.push(userId);
    } else if (filter === 'outgoing') {
      queryText += ' WHERE mr.requester_id = $1';
      params.push(userId);
    } else {
      queryText += ' WHERE mr.payer_id = $1 OR mr.requester_id = $2';
      params.push(userId, userId);
    }

    queryText += ' ORDER BY mr.created_at DESC';

    const res = await pool.query(queryText, params);
    return res.rows as MoneyRequest[];
  }

  /**
   * Accept and Settle a Money Request in PostgreSQL
   * Routes money movement through the central TransferService!
   */
  public static async acceptRequest(
    requestId: string,
    payerId: string,
    idempotencyKey?: string
  ): Promise<{ request: MoneyRequest; transfer: TransferResult }> {
    const request = await this.getRequestById(requestId);

    if (!request) {
      const error: any = new Error('Money request not found.');
      error.statusCode = 404;
      error.errorCode = 'REQUEST_NOT_FOUND';
      throw error;
    }

    if (request.payer_id !== payerId) {
      const error: any = new Error('Only the designated payer can accept this money request.');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN_ACTION';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(`Money request is already ${request.status.toLowerCase()}.`);
      error.statusCode = 400;
      error.errorCode = 'REQUEST_ALREADY_RESOLVED';
      throw error;
    }

    // 1. Execute Fund Transfer using Central Transfer Engine (Row-level locked & atomic)
    const transferResult = await TransferService.executeTransfer({
      senderId: payerId,
      receiverId: request.requester_id,
      amountPoisha: Number(request.amount),
      note: `Request Settlement: ${request.note || 'P2P Payment'}`,
      category: 'Request Settlement',
      type: 'REQUEST_SETTLEMENT',
      idempotencyKey
    });

    // 2. Mark request as ACCEPTED and link transaction ID
    await pool.query(
      `UPDATE money_requests 
       SET status = 'ACCEPTED', transaction_id = $1, resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [transferResult.transaction.id, requestId]
    );

    const updatedRequest = (await this.getRequestById(requestId))!;

    return {
      request: updatedRequest,
      transfer: transferResult
    };
  }

  /**
   * Reject a Money Request
   */
  public static async rejectRequest(requestId: string, payerId: string): Promise<MoneyRequest> {
    const request = await this.getRequestById(requestId);

    if (!request) {
      const error: any = new Error('Money request not found.');
      error.statusCode = 404;
      error.errorCode = 'REQUEST_NOT_FOUND';
      throw error;
    }

    if (request.payer_id !== payerId) {
      const error: any = new Error('Only the designated payer can decline this money request.');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN_ACTION';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(`Money request is already ${request.status.toLowerCase()}.`);
      error.statusCode = 400;
      error.errorCode = 'REQUEST_ALREADY_RESOLVED';
      throw error;
    }

    await pool.query(
      `UPDATE money_requests 
       SET status = 'REJECTED', resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [requestId]
    );

    return (await this.getRequestById(requestId))!;
  }

  /**
   * Cancel an Outgoing Money Request
   */
  public static async cancelRequest(requestId: string, requesterId: string): Promise<MoneyRequest> {
    const request = await this.getRequestById(requestId);

    if (!request) {
      const error: any = new Error('Money request not found.');
      error.statusCode = 404;
      error.errorCode = 'REQUEST_NOT_FOUND';
      throw error;
    }

    if (request.requester_id !== requesterId) {
      const error: any = new Error('Only the requester can cancel this money request.');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN_ACTION';
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error: any = new Error(`Money request is already ${request.status.toLowerCase()}.`);
      error.statusCode = 400;
      error.errorCode = 'REQUEST_ALREADY_RESOLVED';
      throw error;
    }

    await pool.query(
      `UPDATE money_requests 
       SET status = 'CANCELLED', resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [requestId]
    );

    return (await this.getRequestById(requestId))!;
  }
}
