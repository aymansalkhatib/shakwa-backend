import { HttpException } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error-response.interface';
import BaseErrorHandler from './error-handler.strategy';

/**
 * Handles NestJS HttpExceptions
 */
export class HttpExceptionHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    return error instanceof HttpException;
  }

  handle(error: HttpException, traceId: string): ErrorResponse {
    const statusCode = error.getStatus();
    const response = error.getResponse() as any;

    return {
      ...this.createBaseResponse(
        statusCode >= 500 ? 'error' : 'failure',
        statusCode,
        response.message || error.message,
        traceId,
      ),
      context: {
        code: response.code,
        details: response.data,
      },
    };
  }
}
