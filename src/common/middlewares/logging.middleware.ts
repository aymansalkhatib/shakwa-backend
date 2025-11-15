import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { EnvironmentConfig } from '../../shared/modules/app-config';
import { AppLogger } from '../../shared/modules/app-logger/app-logger.service';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logHttp: boolean;
  private readonly logSlowRequests: boolean;
  private readonly slowRequestThreshold: number;

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.logHttp = this.configService.getOrThrow('LOG_HTTP', { infer: true });
    this.logSlowRequests = this.configService.getOrThrow('LOG_SLOW_REQUESTS');
    this.slowRequestThreshold = this.configService.getOrThrow('LOG_SLOW_REQUEST_THRESHOLD');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.logHttp) {
      return next();
    }

    const startTime = Date.now();
    req.startTime = startTime;

    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.requestId = requestId;

    // Set request ID in response header
    res.setHeader('X-Request-ID', requestId);

    const { method, originalUrl, ip, headers, query, params } = req;
    const userAgent = headers['user-agent'] || 'unknown';

    // Log incoming request (only in debug mode to avoid noise)
    this.logger.debug('Incoming HTTP request', {
      context: 'HTTP',
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      query: Object.keys(query).length > 0 ? query : undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
    });

    // Capture response finish event
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;

      const logData = {
        context: 'HTTP',
        requestId,
        method,
        url: originalUrl,
        statusCode,
        responseTime,
        contentLength: parseInt(contentLength as string, 10) || 0,
        ip,
        userAgent,
      };

      // Log slow requests as warnings
      if (this.logSlowRequests && responseTime >= this.slowRequestThreshold) {
        this.logger.slowRequest('Slow HTTP request detected', {
          ...logData,
          threshold: this.slowRequestThreshold,
        });
      }

      // Log based on status code
      if (statusCode >= 500) {
        this.logger.error('HTTP request failed', undefined, logData);
      } else if (statusCode >= 400) {
        this.logger.warn('HTTP request client error', logData);
      } else {
        this.logger.http('HTTP request completed', logData);
      }
    });

    // Capture response close event (client disconnected)
    res.on('close', () => {
      if (!res.writableEnded) {
        const responseTime = Date.now() - startTime;
        this.logger.warn('HTTP request closed by client', {
          context: 'HTTP',
          requestId,
          method,
          url: originalUrl,
          responseTime,
          ip,
        });
      }
    });

    next();
  }
}
