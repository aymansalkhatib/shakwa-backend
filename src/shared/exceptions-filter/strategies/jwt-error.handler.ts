import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error-response.interface';
import BaseErrorHandler from './error-handler.strategy';

/**
 * Handles JWT-related errors
 * Note: We check error names instead of using instanceof to avoid importing jsonwebtoken
 * which has compatibility issues with Node.js v25
 */
export class JwtErrorHandler extends BaseErrorHandler {
  canHandle(error: Error): boolean {
    // Check if the error is a JWT-related error by examining its name
    return (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError' ||
      error.message?.includes('jwt') ||
      error.message?.includes('token')
    );
  }

  handle(error: Error, traceId: string): ErrorResponse {
    // Check if token is expired by error name
    const isExpired = error.name === 'TokenExpiredError';

    return {
      ...this.createBaseResponse(
        'failure',
        HttpStatus.UNAUTHORIZED,
        error.message ?? (isExpired ? 'Token has expired' : 'Invalid token signature'),
        traceId,
      ),
      context: {
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      },
    };
  }
}
