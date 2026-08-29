import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { InAppNotification } from '../types';

export class NotificationService {
  /**
   * Get all notifications for user, including dynamically synthesized DEBT_REMINDERS
   */
  public static async getNotifications(userId: string): Promise<InAppNotification[]> {
    // 1. Fetch stored notifications (e.g. MONEY_NEED)
    const storedRes = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    const storedNotifications: InAppNotification[] = storedRes.rows.map((row) => ({
      ...row,
      is_synthesized: false
    }));

    // 2. Synthesize on-the-fly DEBT_REMINDER notifications for pending loans/requests created by this user
    const pendingLoansRes = await pool.query(
      `SELECT 
        mr.id,
        mr.amount,
        mr.note,
        mr.due_date,
        mr.created_at,
        pu.name as payer_name,
        pu.phone as payer_phone
       FROM money_requests mr
       JOIN users pu ON mr.payer_id = pu.id
       WHERE mr.requester_id = $1 
         AND mr.status = 'PENDING' 
         AND mr.due_date IS NOT NULL`,
      [userId]
    );

    const now = Date.now();
    const synthesizedReminders: InAppNotification[] = [];

    for (const loan of pendingLoansRes.rows) {
      const dueTime = new Date(loan.due_date).getTime();
      const amountBdt = (Number(loan.amount) / 100).toLocaleString();
      const diffHours = (dueTime - now) / (1000 * 60 * 60);

      if (dueTime < now) {
        // OVERDUE Reminder
        synthesizedReminders.push({
          id: `synth_overdue_${loan.id}`,
          user_id: userId,
          type: 'DEBT_REMINDER',
          reference_id: loan.id,
          title: `⚠️ Overdue Debt Reminder: ${loan.payer_name}`,
          message: `${loan.payer_name} has not settled ৳${amountBdt}${loan.note ? ` for "${loan.note}"` : ''} (Was due on ${new Date(loan.due_date).toLocaleDateString()}). Tap to follow up.`,
          is_read: false,
          created_at: loan.due_date,
          is_synthesized: true
        });
      } else if (diffHours <= 24) {
        // DUE SOON Reminder (< 24h)
        synthesizedReminders.push({
          id: `synth_due_${loan.id}`,
          user_id: userId,
          type: 'DEBT_REMINDER',
          reference_id: loan.id,
          title: `⏳ Payment Due Soon from ${loan.payer_name}`,
          message: `${loan.payer_name} owes ৳${amountBdt} due in ${Math.max(1, Math.round(diffHours))} hours.`,
          is_read: false,
          created_at: new Date().toISOString(),
          is_synthesized: true
        });
      }
    }

    // Combine and sort by date descending
    const allNotifications = [...synthesizedReminders, ...storedNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allNotifications;
  }

  /**
   * Mark a stored notification as read
   */
  public static async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (notificationId.startsWith('synth_')) {
      // Synthesized dynamic notifications are virtual, no-op in DB
      return;
    }

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  public static async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Create and persist a new notification in PostgreSQL
   */
  public static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    referenceId?: string
  ): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, reference_id, title, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, CURRENT_TIMESTAMP)`,
      [id, userId, type, referenceId || null, title, message]
    );
  }
}
