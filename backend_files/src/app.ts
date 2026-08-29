import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import { apiRouter } from './routes/api';
import { httpLoggingMiddleware } from './middlewares/logging';
import { Logger } from './utils/logger';

export const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Idempotency-Key', 'X-Idempotency-Key', 'X-Request-Id', 'request-id']
}));

// Gzip / Deflate compression for ultra-fast API response payloads
app.use(compression());
app.use(express.json());

// Structured HTTP Request/Response Logging & Request ID Correlation
app.use(httpLoggingMiddleware);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'FastPay Engine',
    timestamp: new Date().toISOString()
  });
});

// Mount Central API Router
app.use('/api', apiRouter);

// 404 Fallback Handler
app.use((req: Request, res: Response) => {
  const requestId = req.requestId;
  Logger.warn('HTTP', 'NOT_FOUND', `Route '${req.method} ${req.originalUrl}' not found`, {
    requestId,
    method: req.method,
    route: req.originalUrl,
    errorCode: 'ENDPOINT_NOT_FOUND',
  });

  res.status(404).json({
    success: false,
    error_code: 'ENDPOINT_NOT_FOUND',
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Centralized Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.requestId;
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  if (statusCode >= 500) {
    Logger.error('SYSTEM', 'UNHANDLED_ERROR', err.message || 'An unexpected error occurred', {
      requestId,
      errorCode,
      route: req.originalUrl,
      error: err.message,
    }, err);
  } else {
    Logger.warn('HTTP', 'CLIENT_ERROR', err.message || 'Client error', {
      requestId,
      errorCode,
      statusCode,
      route: req.originalUrl,
    });
  }

  res.status(statusCode).json({
    success: false,
    error_code: errorCode,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

export default app;
