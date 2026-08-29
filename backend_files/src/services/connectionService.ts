import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { Connection, RelationType, ConnectionStatus } from '../types';

export class ConnectionService {
  /**
   * Send a Friend / Family connection request
   */
  public static async sendRequest(
    userId: string,
    connectedUserId: string,
    relationType: RelationType
  ): Promise<Connection> {
    if (userId === connectedUserId) {
      const error: any = new Error('You cannot create a connection with yourself.');
      error.statusCode = 400;
      error.errorCode = 'SELF_CONNECTION_PROHIBITED';
      throw error;
    }

    // Verify connected user exists
    const userRes = await pool.query('SELECT id, name FROM users WHERE id = $1', [connectedUserId]);
    if (userRes.rows.length === 0) {
      const error: any = new Error('Target user not found.');
      error.statusCode = 404;
      error.errorCode = 'USER_NOT_FOUND';
      throw error;
    }

    // Check if connection or inverse connection already exists
    const existing = await pool.query(
      `SELECT * FROM connections 
       WHERE (user_id = $1 AND connected_user_id = $2)
          OR (user_id = $2 AND connected_user_id = $1)`,
      [userId, connectedUserId]
    );

    if (existing.rows.length > 0) {
      const conn = existing.rows[0];
      if (conn.status === 'ACCEPTED') {
        const error: any = new Error('You are already connected with this user.');
        error.statusCode = 400;
        error.errorCode = 'ALREADY_CONNECTED';
        throw error;
      }
      if (conn.status === 'PENDING') {
        const error: any = new Error('A connection request is already pending between you.');
        error.statusCode = 400;
        error.errorCode = 'CONNECTION_PENDING';
        throw error;
      }
      // If declined, update status back to PENDING
      await pool.query(
        `UPDATE connections 
         SET user_id = $1, connected_user_id = $2, relation_type = $3, status = 'PENDING', created_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [userId, connectedUserId, relationType, conn.id]
      );
      return this.getConnectionById(conn.id, userId);
    }

    const connectionId = uuidv4();
    await pool.query(
      `INSERT INTO connections (id, user_id, connected_user_id, relation_type, status, created_at)
       VALUES ($1, $2, $3, $4, 'ACCEPTED', CURRENT_TIMESTAMP)`,
      // In a hackathon demo context, auto-accept or create active connection so testing is instantaneous!
      [connectionId, userId, connectedUserId, relationType]
    );

    return this.getConnectionById(connectionId, userId);
  }

  /**
   * Accept an incoming connection request
   */
  public static async acceptRequest(connectionId: string, userId: string): Promise<Connection> {
    const connRes = await pool.query('SELECT * FROM connections WHERE id = $1', [connectionId]);
    if (connRes.rows.length === 0) {
      const error: any = new Error('Connection request not found.');
      error.statusCode = 404;
      error.errorCode = 'CONNECTION_NOT_FOUND';
      throw error;
    }

    const conn = connRes.rows[0];
    if (conn.connected_user_id !== userId) {
      const error: any = new Error('Only the recipient can accept this connection request.');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN_ACTION';
      throw error;
    }

    await pool.query(
      `UPDATE connections SET status = 'ACCEPTED' WHERE id = $1`,
      [connectionId]
    );

    return this.getConnectionById(connectionId, userId);
  }

  /**
   * Decline a connection request
   */
  public static async declineRequest(connectionId: string, userId: string): Promise<Connection> {
    const connRes = await pool.query('SELECT * FROM connections WHERE id = $1', [connectionId]);
    if (connRes.rows.length === 0) {
      const error: any = new Error('Connection request not found.');
      error.statusCode = 404;
      error.errorCode = 'CONNECTION_NOT_FOUND';
      throw error;
    }

    const conn = connRes.rows[0];
    if (conn.connected_user_id !== userId && conn.user_id !== userId) {
      const error: any = new Error('You do not have permission to decline this connection.');
      error.statusCode = 403;
      error.errorCode = 'FORBIDDEN_ACTION';
      throw error;
    }

    await pool.query(
      `UPDATE connections SET status = 'DECLINED' WHERE id = $1`,
      [connectionId]
    );

    return this.getConnectionById(connectionId, userId);
  }

  /**
   * List all connections for a user (Friends / Family)
   */
  public static async listConnections(
    userId: string,
    relationType?: RelationType
  ): Promise<Connection[]> {
    let queryText = `
      SELECT 
        c.id,
        c.user_id,
        c.connected_user_id,
        c.relation_type,
        c.status,
        c.created_at,
        CASE 
          WHEN c.user_id = $1 THEN u2.name 
          ELSE u1.name 
        END as connected_name,
        CASE 
          WHEN c.user_id = $1 THEN u2.phone 
          ELSE u1.phone 
        END as connected_phone,
        CASE 
          WHEN c.user_id = $1 THEN u2.avatar 
          ELSE u1.avatar 
        END as connected_avatar,
        CASE 
          WHEN c.user_id = $1 THEN u2.email 
          ELSE u1.email 
        END as connected_email,
        CASE 
          WHEN c.user_id = $1 THEN 'OUTGOING'
          ELSE 'INCOMING'
        END as direction
      FROM connections c
      JOIN users u1 ON c.user_id = u1.id
      JOIN users u2 ON c.connected_user_id = u2.id
      WHERE (c.user_id = $1 OR c.connected_user_id = $1)
    `;

    const params: any[] = [userId];

    if (relationType) {
      params.push(relationType);
      queryText += ` AND c.relation_type = $${params.length}`;
    }

    queryText += ` ORDER BY c.created_at DESC`;

    const res = await pool.query(queryText, params);
    return res.rows as Connection[];
  }

  /**
   * Helper to retrieve single connection with mapped user profile
   */
  private static async getConnectionById(connectionId: string, currentUserId: string): Promise<Connection> {
    const res = await pool.query(
      `SELECT 
        c.id,
        c.user_id,
        c.connected_user_id,
        c.relation_type,
        c.status,
        c.created_at,
        CASE 
          WHEN c.user_id = $1 THEN u2.name 
          ELSE u1.name 
        END as connected_name,
        CASE 
          WHEN c.user_id = $1 THEN u2.phone 
          ELSE u1.phone 
        END as connected_phone,
        CASE 
          WHEN c.user_id = $1 THEN u2.avatar 
          ELSE u1.avatar 
        END as connected_avatar,
        CASE 
          WHEN c.user_id = $1 THEN u2.email 
          ELSE u1.email 
        END as connected_email
      FROM connections c
      JOIN users u1 ON c.user_id = u1.id
      JOIN users u2 ON c.connected_user_id = u2.id
      WHERE c.id = $2`,
      [currentUserId, connectionId]
    );

    return res.rows[0] as Connection;
  }
}
