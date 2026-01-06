import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if audit should be skipped
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipAudit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Store controller and action names
    (request as any).controllerName = context.getClass().name;
    (request as any).actionName = context.getHandler().name;

    return next.handle().pipe(
      tap((responseBody) => {
        const durationMs = Date.now() - startTime;
        this.auditService.logRequest(request, response, responseBody, durationMs);
      }),
      catchError((error) => {
        const durationMs = Date.now() - startTime;
        this.auditService.logRequest(request, response, null, durationMs, error);
        return throwError(() => error);
      }),
    );
  }
}
