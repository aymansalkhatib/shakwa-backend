import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaseConverterUtils } from '../utils/case-converter.utils';

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Check for X-Case-Format header (default to 'snake' if not provided)
    const caseFormat = (request.headers['x-case-format'] as string)?.toLowerCase() || 'camel';

    return next.handle().pipe(
      map((data) => {
        // Only transform to snake_case if format is 'snake'
        if (caseFormat === 'snake') {
          return CaseConverterUtils.toSnakeCase(data);
        }
        // Return data as-is (camelCase) if format is 'camel'
        return data;
      }),
    );
  }
}
