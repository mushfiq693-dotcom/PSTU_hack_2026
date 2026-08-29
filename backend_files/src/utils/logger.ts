export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  transferId?: string;
  userId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  senderId?: string;
  receiverId?: string;
  walletId?: string;
  amount?: number | string;
  amountBdt?: number | string;
  operation?: string;
  duration?: string | number;
  durationMs?: number;
  errorCode?: string;
  status?: string | number;
  statusCode?: number;
  reason?: string;
  wait?: string | number;
  route?: string;
  method?: string;
  referenceId?: string;
  threads?: number;
  successful?: number;
  blocked?: number;
  totalRequested?: number | string;
  totalTransferred?: number | string;
  error?: string | Error;
  [key: string]: any;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'credentials',
  'database_url',
  'connectionstring'
]);

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  private static currentLevel: LogLevel = (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) || 'INFO';
  private static isProduction: boolean = process.env.NODE_ENV === 'production';

  public static setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.currentLevel];
  }

  /**
   * Sanitizes object by removing/masking sensitive keys
   */
  private static sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(context)) {
      if (value === undefined || value === null) continue;

      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('pass')) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = value.message;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Formats key-value pairs cleanly into string
   */
  private static formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';

    const sanitized = this.sanitizeContext(context);
    const parts: string[] = [];

    for (const [k, v] of Object.entries(sanitized)) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'object') {
        parts.push(`${k}=${JSON.stringify(v)}`);
      } else {
        parts.push(`${k}=${v}`);
      }
    }

    return parts.length > 0 ? parts.join(' ') : '';
  }

  /**
   * Core logging emitter
   */
  private static log(
    level: LogLevel,
    module: string,
    action: string,
    message: string,
    context?: LogContext,
    err?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const contextStr = this.formatContext(context);

    // Standardized log line: [TIMESTAMP] [LEVEL] [MODULE] [ACTION] message key=value
    let logLine = `${timestamp} [${level}] [${module.toUpperCase()}] ${action.toUpperCase()}`;
    if (message) {
      logLine += ` ${message}`;
    }
    if (contextStr) {
      logLine += ` ${contextStr}`;
    }

    switch (level) {
      case 'ERROR':
        console.error(logLine);
        if (!this.isProduction && err && err.stack) {
          console.error(`Stack trace:\n${err.stack}`);
        }
        break;
      case 'WARN':
        console.warn(logLine);
        break;
      case 'DEBUG':
        console.debug(logLine);
        break;
      case 'INFO':
      default:
        console.log(logLine);
        break;
    }
  }

  // Convenience methods
  public static debug(module: string, action: string, message: string = '', context?: LogContext): void {
    this.log('DEBUG', module, action, message, context);
  }

  public static info(module: string, action: string, message: string = '', context?: LogContext): void {
    this.log('INFO', module, action, message, context);
  }

  public static warn(module: string, action: string, message: string = '', context?: LogContext): void {
    this.log('WARN', module, action, message, context);
  }

  public static error(module: string, action: string, message: string = '', context?: LogContext, err?: Error): void {
    this.log('ERROR', module, action, message, context, err);
  }
}

export default Logger;
