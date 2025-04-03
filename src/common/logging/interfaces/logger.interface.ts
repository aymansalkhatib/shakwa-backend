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
  responseTime?: string;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  body?: any;
  time?: any;
  context?: any;
  contentLength?: any;
  levelLog?: any;
  message?: any;
  query?: any;
  params?: any;
  headers?: any;
  [key: string]: any;
}
