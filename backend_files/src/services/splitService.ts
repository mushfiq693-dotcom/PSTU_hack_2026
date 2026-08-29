import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { BillSplit, BillSplitItem, BillCategory } from '../types';
import { TransferService, TransferResult } from './transferService';

export interface CreateSplitParticipantInput {
  userId?: string;
  phone?: string;
  shareAmountPoisha: number;
}

export interface CreateSplitParams {
  creatorId: string;
  title: string;
  totalAmountPoisha: number;
  category: BillCategory;
  participants: CreateSplitParticipantInput[];
}

export class SplitService {
  /**
   * Create a new Bill Split with participants
   */
  public static async createSplit(params: CreateSplitParams): Promise<BillSplit> {
    const { creatorId, title, totalAmountPoisha, category, participants } = params;

    if (!title || title.trim().length === 0) {
      const error: any = new Error('Bill split title is required.');
      error.statusCode = 400;
      error.errorCode = 'TITLE_REQUIRED';
      throw error;
    }

    if (!totalAmountPoisha || totalAmountPoisha <= 0 || !Number.isInteger(totalAmountPoisha)) {
      const error: any = new Error('Total amount must be a positive integer in Poisha.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_TOTAL_AMOUNT';
      throw error;
    }

    if (!participants || participants.length === 0) {
      const error: any = new Error('At least one participant is required for bill splitting.');
      error.statusCode = 400;
      error.errorCode = 'PARTICIPANTS_REQUIRED';
      throw error;
    }

    const splitId = uuidv4();

    // 1. Insert Master Bill Split
    await pool.query(
      `INSERT INTO bill_splits (id, creator_id, title, total_amount, category, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', CURRENT_TIMESTAMP)`,
      [splitId, creatorId, title.trim(), totalAmountPoisha, category || 'RESTAURANT']
    );

    // 2. Resolve and insert participants
    for (const p of participants) {
      let resolvedUserId = p.userId;
      if (!resolvedUserId && p.phone) {
        const userRes = await pool.query('SELECT id FROM users WHERE phone = $1', [p.phone]);
        if (userRes.rows.length > 0) {
          resolvedUserId = userRes.rows[0].id;
        }
      }

      if (!resolvedUserId) {
        continue;
      }

      // Creator's own share is auto-marked as paid
      const isCreator = resolvedUserId === creatorId;
      const itemId = uuidv4();

      await pool.query(
        `INSERT INTO bill_split_items (id, bill_split_id, user_id, share_amount, is_paid, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          itemId,
          splitId,
          resolvedUserId,
          p.shareAmountPoisha,
          isCreator,
          isCreator ? new Date().toISOString() : null
        ]
      );

      // If not creator, send an in-app MONEY_NEED notification
      if (!isCreator) {
        const creatorRes = await pool.query('SELECT name FROM users WHERE id = $1', [creatorId]);
        const creatorName = creatorRes.rows[0]?.name || 'A teammate';
        const shareBdt = (p.shareAmountPoisha / 100).toLocaleString();

        const notifId = uuidv4();
        await pool.query(
          `INSERT INTO notifications (id, user_id, type, reference_id, title, message, is_read, created_at)
           VALUES ($1, $2, 'MONEY_NEED', $3, $4, $5, FALSE, CURRENT_TIMESTAMP)`,
          [
            notifId,
            resolvedUserId,
            splitId,
            `Bill Split: ${title}`,
            `${creatorName} added you to split "${title}" (${category.toLowerCase()}). Your share is ৳${shareBdt}.`
          ]
        );
      }
    }

    return (await this.getSplitById(splitId))!;
  }

  /**
   * Retrieve single Bill Split with full participant progress
   */
  public static async getSplitById(splitId: string): Promise<BillSplit | null> {
    const splitRes = await pool.query(
      `SELECT 
        bs.*,
        u.name as creator_name,
        u.phone as creator_phone
       FROM bill_splits bs
       JOIN users u ON bs.creator_id = u.id
       WHERE bs.id = $1`,
      [splitId]
    );

    if (splitRes.rows.length === 0) return null;
    const split = splitRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT 
        bsi.*,
        u.name as user_name,
        u.phone as user_phone,
        u.avatar as user_avatar
       FROM bill_split_items bsi
       JOIN users u ON bsi.user_id = u.id
       WHERE bsi.bill_split_id = $1
       ORDER BY bsi.is_paid DESC, u.name ASC`,
      [splitId]
    );

    return {
      ...split,
      participants: itemsRes.rows as BillSplitItem[]
    };
  }

  /**
   * List all bill splits for a user (as creator or participant)
   */
  public static async listSplits(userId: string, category?: BillCategory): Promise<BillSplit[]> {
    let queryText = `
      SELECT DISTINCT 
        bs.id,
        bs.creator_id,
        bs.title,
        bs.total_amount,
        bs.category,
        bs.status,
        bs.created_at,
        u.name as creator_name,
        u.phone as creator_phone
      FROM bill_splits bs
      JOIN users u ON bs.creator_id = u.id
      LEFT JOIN bill_split_items bsi ON bs.id = bsi.bill_split_id
      WHERE (bs.creator_id = $1 OR bsi.user_id = $1)
    `;

    const params: any[] = [userId];

    if (category) {
      params.push(category);
      queryText += ` AND bs.category = $${params.length}`;
    }

    queryText += ` ORDER BY bs.created_at DESC`;

    const splitsRes = await pool.query(queryText, params);
    const results: BillSplit[] = [];

    for (const row of splitsRes.rows) {
      const itemsRes = await pool.query(
        `SELECT 
          bsi.*,
          u.name as user_name,
          u.phone as user_phone,
          u.avatar as user_avatar
         FROM bill_split_items bsi
         JOIN users u ON bsi.user_id = u.id
         WHERE bsi.bill_split_id = $1
         ORDER BY bsi.is_paid DESC, u.name ASC`,
        [row.id]
      );

      results.push({
        ...row,
        participants: itemsRes.rows as BillSplitItem[]
      });
    }

    return results;
  }

  /**
   * Settle / Pay a participant's share in a bill split
   * Strictly uses the existing atomic double-entry TransferService!
   */
  public static async paySplitShare(
    splitId: string,
    userId: string,
    idempotencyKey?: string
  ): Promise<{ split: BillSplit; transfer: TransferResult }> {
    const split = await this.getSplitById(splitId);
    if (!split) {
      const error: any = new Error('Bill split not found.');
      error.statusCode = 404;
      error.errorCode = 'SPLIT_NOT_FOUND';
      throw error;
    }

    const participantItem = split.participants.find((p) => p.user_id === userId);
    if (!participantItem) {
      const error: any = new Error('You are not a participant in this bill split.');
      error.statusCode = 403;
      error.errorCode = 'NOT_A_PARTICIPANT';
      throw error;
    }

    if (participantItem.is_paid) {
      const error: any = new Error('Your share is already paid.');
      error.statusCode = 400;
      error.errorCode = 'SHARE_ALREADY_PAID';
      throw error;
    }

    // 1. Execute Fund Transfer using existing Double-Entry Transfer Engine
    const transferResult = await TransferService.executeTransfer({
      senderId: userId,
      receiverId: split.creator_id,
      amountPoisha: Number(participantItem.share_amount),
      note: `Split Share: ${split.title} (${split.category})`,
      category: 'Bill Split',
      type: 'BILL_SPLIT',
      idempotencyKey
    });

    // 2. Mark participant item as paid
    await pool.query(
      `UPDATE bill_split_items 
       SET is_paid = TRUE, paid_at = CURRENT_TIMESTAMP, transaction_id = $1 
       WHERE bill_split_id = $2 AND user_id = $3`,
      [transferResult.transaction.id, splitId, userId]
    );

    // 3. Check if all items are now paid to mark master split as SETTLED
    const remainingUnpaid = await pool.query(
      `SELECT COUNT(*) as count FROM bill_split_items WHERE bill_split_id = $1 AND is_paid = FALSE`,
      [splitId]
    );

    if (parseInt(remainingUnpaid.rows[0].count, 10) === 0) {
      await pool.query(
        `UPDATE bill_splits SET status = 'SETTLED' WHERE id = $1`,
        [splitId]
      );
    }

    const updatedSplit = (await this.getSplitById(splitId))!;

    return {
      split: updatedSplit,
      transfer: transferResult
    };
  }
}
