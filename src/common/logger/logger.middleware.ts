import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CustomLogger } from './logger.service';
import { LogMetadata } from './logger.types';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const { method, originalUrl: url, ip, query, body, header, params } = req;
      const userAgent = req.get('user-agent') || '';
      const userId = req.user?.id || 'Anonymous';
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const responseTime = `${Date.now() - startTime}ms`;

      const time = new Date().toISOString();

      const queryDetails = Object.keys(query).length
        ? JSON.stringify(query)
        : 'No query parameters';

      const bodyDetails = Object.keys(body).length
        ? JSON.stringify(body)
        : 'No body parameters';

      const headerDetails = Object.keys(header).length
        ? JSON.stringify(header)
        : 'No header parameters';

      const paramsDetails = Object.keys(params).length
        ? JSON.stringify(params)
        : 'No params parameters';

      const logMeta: LogMetadata = {
        time,
        method,
        url,
        statusCode,
        responseTime,
        userId,
        ip,
        userAgent,
        context: 'LoggerMiddleware',
        contentLength: `${contentLength}B`,
        query: queryDetails,
        body: bodyDetails,
        header: headerDetails,
        params: paramsDetails,
        level_: 'INFO',
      };

      this.logger.log('Request Log', logMeta);
    });

    next();
  }
}
