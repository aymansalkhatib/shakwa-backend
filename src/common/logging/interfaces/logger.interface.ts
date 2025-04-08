/**
 * Core logging interface that defines the contract for all logger implementations
 */
export interface ILogger {
  log(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  debug(message: string, meta?: LogMetadata): void;
  verbose(message: string, meta?: LogMetadata): void;
}

/**
 * Metadata interface for structured logging
 */
export interface LogMetadata {
  statusCode?: number;
  responseTime?: any;
  requestTime?: any;
  during?: any;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  body?: any;
  context?: any;
  contentLength?: any;
  levelLog?: 'ERROR' | 'INFO';
  message?: any;
  query?: any;
  params?: any;
  headers?: any;
  error?: any;
  traceId?: any;
}
