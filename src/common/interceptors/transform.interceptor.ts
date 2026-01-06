// File: transform.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import * as os from 'os';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const podName = process.env.POD_NAME ?? process.env.HOSTNAME ?? os.hostname();
    const nodeName = process.env.NODE_NAME;
    const namespace = process.env.POD_NAMESPACE;

    return next.handle().pipe(
      map((res: any) => {
        const data = res?.data ?? res;
        const pagination = res?.pagination;

        return {
          data,
          ...(pagination && { pagination }),
          meta: {
            message: this.getSuccessMessage(request.method),
            statusCode: response.statusCode,
            timestamp: new Date().toISOString(),
            status: this.getResponseStatus(response.statusCode),
            path: request.url,
            method: request.method,
            requestId: (request as any).requestId,
            podName,
            nodeName,
            namespace,
          },
        };
      }),
    );
  }

  private getSuccessMessage(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Data retrieved successfully',
      POST: 'Resource created successfully',
      PUT: 'Resource updated successfully',
      PATCH: 'Resource updated successfully',
      DELETE: 'Resource deleted successfully',
    };
    return messages[method.toUpperCase()] || 'Operation completed successfully';
  }

  private getResponseStatus(statusCode: number): 'success' | 'failure' | 'error' {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'failure';
    return 'error';
  }
}
