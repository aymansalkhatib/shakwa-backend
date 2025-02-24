// src/common/logger/logger.service.ts
import { Injectable, Scope } from '@nestjs/common';
import { LoggerService } from '@nestjs/common/services';

@Injectable({ scope: Scope.TRANSIENT })
export class SimpleLogger implements LoggerService {
  private readonly pid = process.pid.toString().padEnd(5);
  private context: string;

  // ألوان ANSI
  private readonly colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
  };

  setContext(context: string) {
    this.context = context;
    return this;
  }

  private getTimestamp(): string {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  private formatMessage(level: string, message: any, ...optionalParams: any[]): string {
    const timestamp = this.getTimestamp();
    const formattedContext = this.context ? `[${this.context}]` : '';
    const formattedLevel = level.toUpperCase().padEnd(7); // لجعل المستوى متساوي العرض

    return `[Nest] ${this.pid} - ${timestamp}    ${formattedLevel} ${formattedContext} ${message}`;
  }

  log(message: any, ...optionalParams: any[]) {
    const formattedMessage = this.formatMessage('LOG', message, ...optionalParams);
    console.log(`${this.colors.green}${formattedMessage}${this.colors.reset}`, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    const formattedMessage = this.formatMessage('ERROR', message, ...optionalParams);
    console.error(`${this.colors.red}${formattedMessage}${this.colors.reset}`, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    const formattedMessage = this.formatMessage('WARN', message, ...optionalParams);
    console.warn(`${this.colors.yellow}${formattedMessage}${this.colors.reset}`, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    const formattedMessage = this.formatMessage('DEBUG', message, ...optionalParams);
    console.debug(`${this.colors.blue}${formattedMessage}${this.colors.reset}`, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    const formattedMessage = this.formatMessage('VERBOSE', message, ...optionalParams);
    console.log(`${this.colors.magenta}${formattedMessage}${this.colors.reset}`, ...optionalParams);
  }
}