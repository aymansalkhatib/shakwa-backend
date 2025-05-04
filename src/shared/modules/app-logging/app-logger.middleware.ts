import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { WinstonLoggerService } from './winston-logger.service';
import { LogMetadata } from './interfaces/logger.interface';

/**
 * Middleware for logging HTTP requests
 */
@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime: Date = new Date();

    res.on('finish', () => {
      const { method, originalUrl: url, ip, query, body, headers, params } = req;
      const userAgent = req.get('user-agent') || '';
      const userId = req.user?.id || 'Anonymous';
      const roles: string[]|string = req.user?.roles || 'Anonymous';
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const endTime: Date = new Date();
      const during = `${endTime.getTime() - startTime.getTime()}ms`;

      const logMeta: LogMetadata = {
        method,
        url,
        statusCode,
        userId,
        roles,
        ip,
        userAgent,
        context: 'LoggerMiddleware',
        contentLength: `${contentLength}B`,
        query: Object.keys(query).length
          ? JSON.stringify(query)
          : 'No query parameters',
        body: Object.keys(body).length ? JSON.stringify(body) : 'No body parameters',
        headers: Object.keys(headers).length
          ? JSON.stringify(headers)
          : 'No header parameters',
        params: Object.keys(params).length
          ? JSON.stringify(params)
          : 'No params parameters',
        levelLog: 'INFO',
        requestTime: startTime.toISOString(),
        responseTime: endTime.toISOString(),
        during: during,
      };

      if (statusCode < 400) {
        this.logger.log('Request Log', logMeta);
      }
    });

    next();
  }
}
