import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CaseConverterUtils } from '../utils/case-converter.utils';

@Injectable()
export class CamelCaseMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check for X-Case-Format header (default to 'snake' if not provided)
    const caseFormat = (req.headers['x-case-format'] as string)?.toLowerCase() || 'camel';

    // Only transform if format is 'snake' (meaning client sends snake_case)
    if (caseFormat === 'snake') {
      // Transform body (this is writable)
      if (req.body) {
        req.body = CaseConverterUtils.toCamelCase(req.body);
      }

      // Transform query (read-only, need to redefine)
      if (req.query && Object.keys(req.query).length > 0) {
        const transformedQuery = CaseConverterUtils.toCamelCase(req.query);
        Object.defineProperty(req, 'query', {
          value: transformedQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      // Transform params (read-only, need to redefine)
      if (req.params && Object.keys(req.params).length > 0) {
        const transformedParams = CaseConverterUtils.toCamelCase(req.params);
        Object.defineProperty(req, 'params', {
          value: transformedParams,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    next();
  }
}
