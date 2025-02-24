import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { createFileTransports } from './transports/file.transport';
import { LogMetadata } from './logger.types';
import { formatConsoleOutput } from './utils/console.formatter';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/config.interface';

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService<AppConfig>) {
    const customFormatWithColor = winston.format.printf((info) => {
      return formatConsoleOutput(info as LogMetadata, true);
    });

    const customFormatWithoutColor = winston.format.printf((info) => {
      return formatConsoleOutput(info as LogMetadata, false);
    });

    console.log(this.configService.get('LOG_REQUEST'));
    console.log(this.configService.get('LOG_ERROR'));
    this.logger = winston.createLogger({
      transports: [
        ...(this.configService.get<boolean>('LOG_ERROR') == true
          ? [
              new winston.transports.Console({
                log(info: any, next: () => void): any {
                  if (info.level_?.toString().toLowerCase() === 'error') {
                    console.log(formatConsoleOutput(info, true));
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
                  if (info.level_.toString().toLowerCase() !== 'error') {
                    console.log(formatConsoleOutput(info, true));
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

        // Add file transports
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
