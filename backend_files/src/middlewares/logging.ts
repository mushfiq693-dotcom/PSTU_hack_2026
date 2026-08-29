import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export function httpLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['request-id'] as string) ||
    `req_${uuidv4().substring(0, 8)}`;

  req.requestId = requestId;
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', requestId);

  // Exclude noisy assets if any
  const route = req.originalUrl || req.url;

  const userId = (req.headers['x-user-id'] as string) || undefined;

  Logger.info('HTTP', 'REQUEST', '', {
    requestId,
    method: req.method,
    route,
    userId: userId || undefined,
  });

  // Capture response status & duration on finish
  res.on('finish', () => {
    const durationMs = Date.now() - (req.startTime || Date.now());
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;

    const logContext = {
      requestId,
      method: req.method,
      route,
      status: statusCode,
      duration: `${durationMs}ms`,
      durationMs,
      errorCode: (res as any).locals?.errorCode || (isError ? `HTTP_${statusCode}` : undefined),
    };

    if (statusCode >= 500) {
      Logger.error('HTTP', 'RESPONSE', '', logContext);
    } else if (statusCode >= 400) {
      Logger.warn('HTTP', 'RESPONSE', '', logContext);
    } else {
      Logger.info('HTTP', 'RESPONSE', '', logContext);
    }
  });

  next();
}
