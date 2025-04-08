import { HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';
import BaseErrorHandler from './error-handler.strategy';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles Multer file upload errors
 */
export class MulterErrorHandler extends BaseErrorHandler {
  private readonly errorMessages: Record<string, string> = {
    LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
    LIMIT_FILE_COUNT: 'Too many files uploaded',
    LIMIT_UNEXPECTED_FILE: 'Unexpected field',
    LIMIT_FIELD_KEY: 'Field name too long',
    LIMIT_FIELD_VALUE: 'Field value too long',
    LIMIT_FIELD_COUNT: 'Too many fields',
    LIMIT_PART_COUNT: 'Too many parts',
  };

  canHandle(error: Error): boolean {
    return error instanceof MulterError;
  }

  handle(error: MulterError, traceId: string): ErrorResponse {
    return {
      ...this.createBaseResponse(
        'failure',
        HttpStatus.BAD_REQUEST,
        this.errorMessages[error.code] || 'File upload error',
        traceId,
      ),
      context: {
        code: `UPLOAD_${error.code}`,
        details: { field: error.field },
      },
    };
  }
}
