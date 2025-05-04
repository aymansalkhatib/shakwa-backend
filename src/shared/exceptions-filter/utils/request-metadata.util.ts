import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { LogMetadata } from 'src/shared/modules/app-logging/interfaces/logger.interface';

/**
 * Extracts metadata from an HTTP request for logging purposes
 * Sanitizes sensitive information and handles empty values gracefully
 */
export function extractRequestMetadata(request: Request): LogMetadata {
  const endTime = new Date();

  return {
    userId: (request.user as any)?.id || 'anonymous',
    method: request.method,
    url: request.originalUrl || request.url,
    ip: request.ip || request.socket.remoteAddress || 'unknown',
    userAgent: request.get('user-agent') || 'unknown',
    contentLength: `${request.get('content-length') || '0'}B`,
    body: sanitizeRequestBody(request.body, 'No body parameters'),
    headers: sanitizeHeaders(request.headers),
    query:
      Object.keys(request.query).length > 0 ? request.query : 'No query parameters',
    params:
      Object.keys(request.params).length > 0
        ? request.params
        : 'No params parameters',
    requestTime: 'Unknown',
    responseTime: endTime.toISOString(),
    during: 'Unknown',
  };
}

/**
 * Sanitizes request body by redacting sensitive fields
 */
function sanitizeRequestBody(body: any, message: string): any {
  if (!body || Object.keys(body).length === 0) {
    return message;
  }

  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'authorization',
    'apiKey',
    'api_key',
    'refreshToken',
    'refresh_token',
  ];

  sensitiveFields.forEach((field) => {
    if (field.toLowerCase() in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Sanitizes request headers by redacting sensitive information
 */
function sanitizeHeaders(headers: any): any {
  if (!headers || Object.keys(headers).length === 0) {
    return null;
  }

  const sanitized = { ...headers };
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'api-key',
    'x-auth-token',
    'x-refresh-token',
  ];

  sensitiveHeaders.forEach((header) => {
    if (header.toLowerCase() in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

export function getErrorStatus(exception: Error): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}
