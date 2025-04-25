import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import { ConsoleFormatter } from './formatters/console.formatter';
import { ILogger, LogMetadata } from './interfaces/logger.interface';
import { createFileTransports } from './transports/file.transport';
import { AppConfigModel } from '../config/app_config.module';

/**
 * Winston-based logger implementation
 */
@Injectable()
export class WinstonLoggerService implements LoggerService, ILogger {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService<AppConfigModel>) {
    const customFormatWithColor = winston.format.printf((info) => {
      return ConsoleFormatter.format(info, true);
    });

    const customFormatWithoutColor = winston.format.printf((info) => {
      return ConsoleFormatter.format(info, false);
    });

    this.logger = winston.createLogger({
      transports: [
        ...(this.configService.get<boolean>('LOG_ERROR') === true
          ? [
              new winston.transports.Console({
                log(info: any, next: () => void): any {
                  if (info.levelLog?.toString().toLowerCase() === 'error') {
                    console.log(ConsoleFormatter.format(info, true));
                    next();
                  }
                  return;
                },
                format: winston.format.combine(
                  winston.format.colorize(),
                  winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS',
                  }),
                  customFormatWithColor,
                ),
              }),
            ]
          : []),
        ...(this.configService.get<boolean>('LOG_REQUEST') === true
          ? [
              new winston.transports.Console({
                log(info: any, next: () => void): any {
                  if (info.levelLog.toString().toLowerCase() !== 'error') {
                    console.log(ConsoleFormatter.format(info, true));
                    next();
                  }
                  return;
                },
                format: winston.format.combine(
                  winston.format.colorize(),
                  winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss.SSS',
                  }),
                  customFormatWithColor,
                ),
              }),
            ]
          : []),
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
