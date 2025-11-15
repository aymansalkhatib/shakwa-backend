import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import BaseErrorHandler from './error-handler.strategy';
import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Handles TypeORM database errors including constraint violations
 */
export class TypeOrmErrorHandler extends BaseErrorHandler {
  private readonly errorCodeMap: Record<string, { message: string; status: number; code: string }> =
    {
      // PostgreSQL error codes
      '23502': {
        message: 'Required field cannot be empty',
        status: HttpStatus.BAD_REQUEST,
        code: 'REQUIRED_FIELD_MISSING',
      },
      '23503': {
        message: 'Invalid reference provided',
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_REFERENCE',
      },
      '23505': {
        message: 'This record already exists',
        status: HttpStatus.CONFLICT,
        code: 'DUPLICATE_RECORD',
      },
      '23514': {
        message: 'Invalid value provided',
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_VALUE',
      },
      '23001': {
        message: 'Value exceeds maximum length',
        status: HttpStatus.BAD_REQUEST,
        code: 'VALUE_TOO_LONG',
      },
      '42703': {
        message: 'Invalid data provided',
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_DATA',
      },
      '42P01': {
        message: 'Service temporarily unavailable',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'SERVICE_ERROR',
      },
      '42804': {
        message: 'Invalid data format',
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_FORMAT',
      },
      '22001': {
        message: 'Text value is too long',
        status: HttpStatus.BAD_REQUEST,
        code: 'TEXT_TOO_LONG',
      },
      '22003': {
        message: 'Number value is out of range',
        status: HttpStatus.BAD_REQUEST,
        code: 'NUMBER_OUT_OF_RANGE',
      },
      '08001': {
        message: 'Service temporarily unavailable',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SERVICE_UNAVAILABLE',
      },
      '08006': {
        message: 'Service connection lost',
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'CONNECTION_LOST',
      },
      // MySQL error codes
      '1062': {
        message: 'This record already exists',
        status: HttpStatus.CONFLICT,
        code: 'DUPLICATE_RECORD',
      },
      '1452': {
        message: 'Invalid reference provided',
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_REFERENCE',
      },
      '1451': {
        message: 'Cannot delete record as it is being used',
        status: HttpStatus.BAD_REQUEST,
        code: 'RECORD_IN_USE',
      },
      '1406': {
        message: 'Data value is too long',
        status: HttpStatus.BAD_REQUEST,
        code: 'DATA_TOO_LONG',
      },
      '1048': {
        message: 'Required field cannot be empty',
        status: HttpStatus.BAD_REQUEST,
        code: 'REQUIRED_FIELD_MISSING',
      },
      '1264': {
        message: 'Value is out of acceptable range',
        status: HttpStatus.BAD_REQUEST,
        code: 'VALUE_OUT_OF_RANGE',
      },
    };

  canHandle(error: Error): boolean {
    return error instanceof QueryFailedError;
  }

  handle(error: QueryFailedError, traceId: string): ErrorResponse {
    const driverError = error.driverError as any;
    const errorCode = driverError?.code || driverError?.errno?.toString();

    // Get error mapping or use default
    const errorInfo = this.errorCodeMap[errorCode] || {
      message: 'An error occurred while processing your request',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
    };

    return {
      ...this.createBaseResponse(
        errorInfo.status >= 500 ? 'error' : 'failure',
        errorInfo.status,
        errorInfo.message,
        traceId,
      ),
      context: {
        code: errorInfo.code,
      },
    };
  }
}
