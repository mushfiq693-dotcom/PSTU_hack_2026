import { Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AuthenticatedRequest } from './auth';

export async function idempotencyMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only apply to state-mutating requests
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
    next();
    return;
  }

  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

  if (!idempotencyKey) {
    next();
    return;
  }

  const userId = req.user?.id || 'anonymous';

  try {
    // 1. Check if this key was already processed
    const existingRes = await pool.query(
      `SELECT key, user_id, status_code, response_body, created_at 
       FROM idempotency_records 
       WHERE key = $1`,
      [idempotencyKey]
    );

    if (existingRes.rows.length > 0) {
      const existingRecord = existingRes.rows[0];
      res.setHeader('X-Idempotent-Replay', 'true');
      res.setHeader('X-Idempotency-Key', idempotencyKey);
      res.status(existingRecord.status_code).json(JSON.parse(existingRecord.response_body));
      return;
    }

    // 2. Intercept response to store upon successful completion
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      const statusCode = res.statusCode || 200;
      if (statusCode >= 200 && statusCode < 500) {
        pool.query(
          `INSERT INTO idempotency_records (key, user_id, status_code, response_body, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET response_body = EXCLUDED.response_body`,
          [idempotencyKey, userId, statusCode, JSON.stringify(body)]
        ).catch((err) => {
          console.error('Failed to cache idempotency record:', err);
        });
      }

      res.setHeader('X-Idempotency-Key', idempotencyKey);
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}
