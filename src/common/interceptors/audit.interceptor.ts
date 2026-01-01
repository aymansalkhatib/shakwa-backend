import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Role } from '../enums/role.enum';
import { AuditService } from '../../modules/audit/services/audit.service';
import { CreateAuditLogDto } from '../../modules/audit/dtos/request/create-audit-log.dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Extract user information from request
    const user = request.user;
    const userId = user?.id || null;
    const userType = this.getUserType(request.role);

    // Extract request details
    const method = request.method;
    const url = request.url;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    // Sanitize request body (remove sensitive data)
    const requestBody = this.sanitizeBody(request.body);
    const queryParams = request.query;

    return next.handle().pipe(
      tap(async () => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Save audit log asynchronously (don't block response)
        setImmediate(() => {
          const dto = new CreateAuditLogDto();
          dto.userId = userId;
          dto.userType = userType;
          dto.method = method;
          dto.url = url;
          dto.ipAddress = ipAddress;
          dto.userAgent = userAgent;
          dto.statusCode = statusCode;
          dto.responseTime = responseTime;
          dto.requestBody = requestBody;
          dto.queryParams = queryParams;

          this.auditService.saveLog(dto);
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log failed requests too
        setImmediate(() => {
          const dto = new CreateAuditLogDto();
          dto.userId = userId;
          dto.userType = userType;
          dto.method = method;
          dto.url = url;
          dto.ipAddress = ipAddress;
          dto.userAgent = userAgent;
          dto.statusCode = statusCode;
          dto.responseTime = responseTime;
          dto.requestBody = requestBody;
          dto.queryParams = queryParams;
          dto.metadata = { error: error.message };

          this.auditService.saveLog(dto);
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Determine user type based on role from JWT payload
   */
  private getUserType(role?: Role): string {
    if (!role) return 'anonymous';

    switch (role) {
      case Role.CITIZEN:
        return 'citizen';
      case Role.ADMIN:
        return 'admin';
      case Role.STAFF:
        return 'staff';
      default:
        return 'unknown';
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      null
    );
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'currentPassword',
      'newPassword',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'cvv',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
