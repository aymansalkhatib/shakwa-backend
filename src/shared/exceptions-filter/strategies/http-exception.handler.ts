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

    // Convert message array to single string if needed
    let message: string | string[];
    if (Array.isArray(response.message)) {
      // If single error, return as string; otherwise return array
      message = response.message.length === 1 ? response.message[0] : response.message;
    } else {
      message = response.message || error.message;
    }

    const baseResponse = this.createBaseResponse(
      statusCode,
      statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
      message,
      traceId,
    );

    return {
      ...baseResponse,
      context: {
        ...baseResponse.context,
        ...(response.data || response.error || response.code
          ? { details: response.data || response.error || response.code }
          : {}),
      },
    };
  }
}
