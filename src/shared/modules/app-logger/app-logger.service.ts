// File: app.logger.ts
import { Injectable, LoggerService, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { EnvironmentConfig } from '../app-config';
import { LogContext } from './interfaces/log-context.interface';
import { LoggerPaths } from './interfaces/logger-paths.interface';

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

  private readonly paths: LoggerPaths;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    const nodeEnv = this.configService.get('NODE_ENV') ?? 'development';
    const isProduction = nodeEnv === 'production';

    const rootLogDir = this.configService.get('LOG_DIR', { infer: true }) ?? './logs';
    const logDir = path.resolve(process.cwd(), rootLogDir);

    this.paths = {
      root: logDir,
      app: path.join(logDir, 'app'),
      error: path.join(logDir, 'error'),
      exceptions: path.join(logDir, 'exceptions'),
      rejections: path.join(logDir, 'rejections'),
    };

    for (const dir of Object.values(this.paths)) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const zipRaw = this.configService.get('LOG_ZIP_ARCHIVE');
    const consoleRaw = this.configService.get('LOG_CONSOLE');

    const parseBool = (value: unknown, fallback: boolean): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n'].includes(normalized)) return false;
      }
      return fallback;
    };

    this.config = {
      level: this.configService.get('LOG_LEVEL') ?? 'info',
      logDir,
      maxSize: this.configService.get('LOG_MAX_SIZE') ?? '20m',
      maxFiles: this.configService.get('LOG_MAX_FILES') ?? '14d',
      errorMaxFiles: this.configService.get('LOG_ERROR_MAX_FILES') ?? '30d',
      zipArchive: parseBool(zipRaw, true),
      console: parseBool(consoleRaw, !isProduction),
      isProduction,
    };

    this.logger = this.createLogger();
  }

  onModuleInit(): void {
    this.log('Logger initialized', { context: 'AppLogger' });
  }

  onModuleDestroy(): void {
    for (const transport of this.logger.transports) {
      if (typeof (transport as any).close === 'function') {
        (transport as any).close();
      }
    }
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    transports.push(
      this.createFileTransport({
        dir: this.paths.app,
        filename: 'app-%DATE%.log',
        level: 'info',
        maxFiles: this.config.maxFiles,
      }),
    );

    transports.push(
      this.createFileTransport({
        dir: this.paths.error,
        filename: 'error-%DATE%.log',
        level: 'error',
        maxFiles: this.config.errorMaxFiles,
      }),
    );

    if (this.config.console) {
      transports.push(this.createConsoleTransport());
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp({ format: () => new Date().toISOString() }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      transports,
      // exceptions
      exceptionHandlers: [
        new DailyRotateFile({
          dirname: this.paths.exceptions,
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: this.config.zipArchive,
          maxSize: this.config.maxSize,
          maxFiles: this.config.errorMaxFiles,
          utc: true,
          format: winston.format.combine(
            winston.format.timestamp({
              format: () => new Date().toISOString(),
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
      // unhandled rejections
      rejectionHandlers: [
        new DailyRotateFile({
          dirname: this.paths.rejections,
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: this.config.zipArchive,
          maxSize: this.config.maxSize,
          maxFiles: this.config.errorMaxFiles,
          utc: true,
          format: winston.format.combine(
            winston.format.timestamp({
              format: () => new Date().toISOString(),
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
      exitOnError: false,
    });
  }

  private createFileTransport(options: {
    dir: string;
    filename: string;
    level: string;
    maxFiles: string;
  }): DailyRotateFile {
    return new DailyRotateFile({
      dirname: options.dir,
      filename: options.filename,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: this.config.zipArchive,
      maxSize: this.config.maxSize,
      maxFiles: options.maxFiles,
      level: options.level,
      utc: true,
      format: winston.format.combine(
        winston.format.timestamp({ format: () => new Date().toISOString() }),
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

  // ======================================
  // Standard NestJS LoggerService interface
  // ======================================

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
      this.logger.error(message, { ...(context || {}), trace, stack: trace });
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
    this.logger.info(message, { type: 'http', ...(meta || {}) });
  }

  /**
   * Log slow requests
   */
  slowRequest(message: string, meta?: LogContext & Record<string, any>): void {
    this.logger.warn(message, { type: 'slow-request', ...(meta || {}) });
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
