import { Injectable, LoggerService, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { EnvironmentConfig } from '../app-config';

export interface LogContext {
  context?: string;
  requestId?: string;
  userId?: string | number;
  [key: string]: any;
}

@Injectable()
export class AppLogger implements LoggerService, OnModuleInit, OnModuleDestroy {
  private readonly logger: winston.Logger;
  private readonly config: {
    level: string;
    logDir: string;
    maxSize: string;
    maxFiles: string;
    errorMaxFiles: string;
    zipArchive: boolean;
    console: boolean;
    isProduction: boolean;
  };

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const logDir = path.resolve(
      process.cwd(),
      this.configService.get('LOG_DIR', { infer: true }) || './logs',
    );

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.config = {
      level:
        this.configService.get('LOG_LEVEL', { infer: true }) || (isProduction ? 'info' : 'debug'),
      logDir,
      maxSize: this.configService.get('LOG_MAX_SIZE', { infer: true }) || '20m',
      maxFiles: this.configService.get('LOG_MAX_FILES', { infer: true }) || '14d',
      errorMaxFiles: this.configService.get('LOG_ERROR_MAX_FILES', { infer: true }) || '30d',
      zipArchive: this.configService.get('LOG_ZIP_ARCHIVE', { infer: true }) ?? true,
      console: this.configService.get('LOG_CONSOLE', { infer: true }) ?? !isProduction,
      isProduction,
    };

    this.logger = this.createLogger();
  }

  onModuleInit() {
    this.log('Logger initialized', 'AppLogger');
  }

  onModuleDestroy() {
    // Ensure all logs are flushed before shutdown
    this.logger.end();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // File transports with daily rotation
    transports.push(
      this.createFileTransport({
        filename: 'app-%DATE%.log',
        level: 'info',
        maxFiles: this.config.maxFiles,
      }),
    );

    transports.push(
      this.createFileTransport({
        filename: 'error-%DATE%.log',
        level: 'error',
        maxFiles: this.config.errorMaxFiles,
      }),
    );

    // Console transport for development
    if (this.config.console) {
      transports.push(this.createConsoleTransport());
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      transports,
      // Handle exceptions and rejections
      exceptionHandlers: [
        new DailyRotateFile({
          dirname: this.config.logDir + '/' + new Date().toISOString().split('T')[0],
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: this.config.zipArchive,
          maxSize: this.config.maxSize,
          maxFiles: this.config.errorMaxFiles,
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          dirname: this.config.logDir + '/' + new Date().toISOString().split('T')[0],
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: this.config.zipArchive,
          maxSize: this.config.maxSize,
          maxFiles: this.config.errorMaxFiles,
        }),
      ],
      exitOnError: false,
    });
  }

  private createFileTransport(options: {
    filename: string;
    level: string;
    maxFiles: string;
  }): DailyRotateFile {
    return new DailyRotateFile({
      dirname: this.config.logDir + '/' + new Date().toISOString().split('T')[0],
      filename: options.filename,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: this.config.zipArchive,
      maxSize: this.config.maxSize,
      maxFiles: options.maxFiles,
      level: options.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });
  }

  private createConsoleTransport(): winston.transports.ConsoleTransportInstance {
    return new winston.transports.Console({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(({ level, message, timestamp, context, requestId, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const requestIdStr = requestId ? `[${requestId}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level} ${contextStr}${requestIdStr}: ${message}${metaStr}`;
        }),
      ),
    });
  }

  log(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.info(message, { context });
    } else {
      this.logger.info(message, context || {});
    }
  }

  error(message: string, trace?: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.error(message, { context, trace, stack: trace });
    } else {
      this.logger.error(message, { ...context, trace, stack: trace });
    }
  }

  warn(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.warn(message, { context });
    } else {
      this.logger.warn(message, context || {});
    }
  }

  debug(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.debug(message, { context });
    } else {
      this.logger.debug(message, context || {});
    }
  }

  verbose(message: string, context?: string | LogContext): void {
    if (typeof context === 'string') {
      this.logger.verbose(message, { context });
    } else {
      this.logger.verbose(message, context || {});
    }
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, meta?: LogContext & Record<string, any>): void {
    this.logger.info(message, { type: 'http', ...meta });
  }

  /**
   * Log slow requests
   */
  slowRequest(message: string, meta?: LogContext & Record<string, any>): void {
    this.logger.warn(message, { type: 'slow-request', ...meta });
  }

  /**
   * Log with custom level and context
   */
  logWithLevel(
    level: 'error' | 'warn' | 'info' | 'debug' | 'verbose',
    message: string,
    context?: LogContext,
  ): void {
    this.logger[level](message, context || {});
  }
}
