import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error-response.interface';
import BaseErrorHandler from './error-handler.strategy';

/**
 * Handles Multer file upload errors
 */
export class MulterErrorHandler extends BaseErrorHandler {
  private readonly errorMessages: Record<string, string> = {
    'Too many files': 'Too many files uploaded',
    'Unexpected field': 'Unexpected field',
  };

  canHandle(error: Error): boolean {
    return this.errorMessages[error.message] != null;
  }

  handle(error: Error, traceId: string): ErrorResponse {
    return {
      ...this.createBaseResponse(
        'failure',
        HttpStatus.BAD_REQUEST,
        this.errorMessages[error.message] || 'File upload error',
        traceId,
      ),
    };
  }
}
