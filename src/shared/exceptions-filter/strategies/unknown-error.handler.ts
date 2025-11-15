import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error-response.interface';
import BaseErrorHandler from './error-handler.strategy';

/**
 * Handles unknown/unexpected errors
 */
export class UnknownErrorHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    return true; // Fallback handler for any error
  }

  handle(error: Error, requestId: string): ErrorResponse {
    const baseResponse = this.createBaseResponse(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal Server Error',
      'An unexpected error occurred',
      requestId,
    );

    return {
      ...baseResponse,
      context: {
        ...baseResponse.context,
        details: error?.message,
      },
    };
  }
}
