import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditLogEntity, HttpMethod } from '../entities/audit-log.entity';
import { AuditLogRepository } from '../repositories/audit-log.repository';

// Sensitive fields to mask in logs
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie', 'credit_card'];

@Injectable()
export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async logRequest(
    req: Request,
    res: Response,
    responseBody: any,
    durationMs: number,
    error?: Error,
  ): Promise<void> {
    const auditData = this.buildAuditData(req, res, responseBody, durationMs, error);

    // Save asynchronously to not block response
    await this.auditLogRepository.createAsync(auditData);
  }

  private buildAuditData(
    req: Request,
    res: Response,
    responseBody: any,
    durationMs: number,
    error?: any,
  ): Partial<AuditLogEntity> {
    const user = req.user;

    // Determine status code - for errors, extract from error or use 500
    let statusCode = res.statusCode;
    if (error) {
      statusCode = error.status || error.statusCode || error.getStatus?.() || 500;
    }

    return {
      // Request Info
      method: req.method as HttpMethod,
      endpoint: this.getEndpoint(req),
      queryParams: this.stringifyQuery(req.query),
      requestBody: this.sanitizeBody(req.body),
      requestHeaders: this.sanitizeHeaders(req.headers),

      // Response Info
      statusCode,
      responseBody: this.sanitizeResponse(responseBody),
      errorMessage: error?.message || null,

      // User & Auth
      userId: user?.id || null,
      userType: this.getUserType(user),
      accessToken: this.extractToken(req),

      // Client Info
      clientIp: this.getClientIp(req),
      userAgent: req.headers['user-agent']?.substring(0, 500) || null,
      deviceType: this.parseDeviceType(req.headers['user-agent']),
      platform: this.parsePlatform(req.headers['user-agent']),

      // Performance & Tracing
      durationMs,
      traceId: (req as any).requestId || (req.headers['x-request-id'] as string) || null,
      spanId: (req.headers['x-span-id'] as string) || null,

      // Context
      apiVersion: this.extractApiVersion(req),
      controllerName: (req as any).controllerName || null,
      actionName: (req as any).actionName || null,
      metadata: this.buildMetadata(req),
    };
  }

  private getEndpoint(req: Request): string {
    // Get route pattern instead of actual URL (e.g., /users/:id instead of /users/123)
    const route = (req as any).route?.path || req.path;
    return route.substring(0, 500);
  }

  private stringifyQuery(query: any): string | null {
    if (!query || Object.keys(query).length === 0) return null;
    const sanitized = this.sanitizeBody(query);
    return JSON.stringify(sanitized).substring(0, 2000);
  }

  private sanitizeBody(body: any): Record<string, any> | null {
    if (!body || Object.keys(body).length === 0) return null;

    const sanitized = { ...body };
    for (const field of SENSITIVE_FIELDS) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Limit size
    const str = JSON.stringify(sanitized);
    if (str.length > 10000) {
      return { _truncated: true, _size: str.length };
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): Record<string, any> | null {
    const safeHeaders: Record<string, any> = {};
    const allowedHeaders = [
      'content-type',
      'accept',
      'accept-language',
      'origin',
      'referer',
      'x-request-id',
      'x-forwarded-for',
      'x-real-ip',
    ];

    for (const header of allowedHeaders) {
      if (headers[header]) {
        safeHeaders[header] = headers[header];
      }
    }

    return Object.keys(safeHeaders).length > 0 ? safeHeaders : null;
  }

  private sanitizeResponse(body: any): Record<string, any> | null {
    if (!body) return null;

    // Don't store large responses
    const str = JSON.stringify(body);
    if (str.length > 5000) {
      return { _truncated: true, _size: str.length };
    }

    return this.sanitizeBody(body);
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    // Store only first/last 10 chars for identification
    const token = authHeader.replace('Bearer ', '');
    if (token.length > 20) {
      return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
    }
    return token;
  }

  private getUserType(user: any): string | null {
    if (!user) return null;
    if (user.role) return user.role;
    if (user.type) return user.type;
    if (user.isAdmin) return 'admin';
    return 'user';
  }

  private getClientIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || null;
  }

  private parseDeviceType(userAgent?: string): string | null {
    if (!userAgent) return null;
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    if (/bot|crawler|spider/i.test(userAgent)) return 'bot';
    return 'desktop';
  }

  private parsePlatform(userAgent?: string): string | null {
    if (!userAgent) return null;
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad/i.test(userAgent)) return 'iOS';
    return null;
  }

  private extractApiVersion(req: Request): string | null {
    // Extract from URL: /api/v1/... or /api/v2/...
    const match = req.path.match(/\/v(\d+)\//);
    return match ? `v${match[1]}` : null;
  }

  private buildMetadata(req: Request): Record<string, any> | null {
    const metadata: Record<string, any> = {};

    // Add any custom metadata from request
    if ((req as any).metadata) {
      Object.assign(metadata, (req as any).metadata);
    }

    // Add content length
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      metadata.requestSize = parseInt(contentLength, 10);
    }

    return Object.keys(metadata).length > 0 ? metadata : null;
  }
}
