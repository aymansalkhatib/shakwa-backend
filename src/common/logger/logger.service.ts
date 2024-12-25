import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { createFileTransports } from './transports/file.transport';
import { LogMetadata } from './logger.types';
import { formatConsoleOutput } from './utils/console.formatter';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const customFormatWithColor = winston.format.printf((info) => {
      return formatConsoleOutput(info as LogMetadata, true);
    });

    const customFormatWithoutColor = winston.format.printf((info) => {
      return formatConsoleOutput(info as LogMetadata, false);
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        customFormatWithColor,
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss.SSS',
            }),
            customFormatWithColor,
          ),
        }),
        ...createFileTransports(customFormatWithoutColor),
      ],
    });
  }

  log(message: string, meta?: LogMetadata) {
    this.logWithMeta('info', message, meta);
  }

  error(message: string, meta?: LogMetadata) {
    this.logWithMeta('error', message, meta);
  }

  warn(message: string, meta?: LogMetadata) {
    this.logWithMeta('warn', message, meta);
  }

  debug(message: string, meta?: LogMetadata) {
    this.logWithMeta('debug', message, meta);
  }

  verbose(message: string, meta?: LogMetadata) {
    this.logWithMeta('verbose', message, meta);
  }

  private logWithMeta(level: string, message: string, meta?: LogMetadata) {
    this.logger.log(level, message, { ...meta });
  }
}
