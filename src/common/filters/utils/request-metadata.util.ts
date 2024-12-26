import { Request } from 'express';
import { LogMetadata } from '../../logger/logger.types';

export function extractRequestMetadata(
  request: Request,
  startTime: number,
): LogMetadata {
  const responseTime = `${Date.now() - startTime}ms`;

  return {
    level_: 'Error',

    statusCode: request.res?.statusCode,
    responseTime,
    userId: request.user?.id || 'anonymous',
    method: request.method,
    url: request.originalUrl || request.url,
    ip: request.ip || request.socket.remoteAddress,
    userAgent: request.get('user-agent') || 'unknown',
    contentLength: (request.get('content-length') || '0') + 'B',
    body: sanitizeRequestBody(request.body, 'No body parameters'),
    time: new Date().toISOString(),
    headers: sanitizeHeaders(request.headers, 'No headers parameters'),
    query:
      Object.keys(request.query).length !== 0
        ? request.query
        : 'No query parameters',
    params:
      Object.keys(request.params).length !== 0
        ? request.params
        : 'No params parameters',
  };
}

function sanitizeRequestBody(body: any, message: string): any {
  if (!body || Object.keys(body).length === 0) return message;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'authorization'];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function sanitizeHeaders(headers: any, message: string): any {
  if (!headers || Object.keys(headers).length === 0) return message;

  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  sensitiveHeaders.forEach((header) => {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}
