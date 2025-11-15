import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ErrorResponse } from '../interfaces/error-response.interface';
import BaseErrorHandler from './error-handler.strategy';

/**
 * Handles TypeORM database errors including constraint violations
 */
export class TypeOrmErrorHandler extends BaseErrorHandler {
  private readonly errorCodeMap: Record<
    string,
    { message: string; statusCode: number; error: string }
  > = {
    // PostgreSQL error codes
    '23502': {
      message: 'Required field cannot be empty',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'REQUIRED_FIELD_MISSING',
    },
    '23503': {
      message: 'Invalid reference provided',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_REFERENCE',
    },
    '23505': {
      message: 'This record already exists',
      statusCode: HttpStatus.CONFLICT,
      error: 'DUPLICATE_RECORD',
    },
    '23514': {
      message: 'Invalid value provided',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_VALUE',
    },
    '23001': {
      message: 'Value exceeds maximum length',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'VALUE_TOO_LONG',
    },
    '42703': {
      message: 'Invalid data provided',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_DATA',
    },
    '42P01': {
      message: 'Service temporarily unavailable',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'SERVICE_ERROR',
    },
    '42804': {
      message: 'Invalid data format',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_FORMAT',
    },
    '22001': {
      message: 'Text value is too long',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'TEXT_TOO_LONG',
    },
    '22003': {
      message: 'Number value is out of range',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'NUMBER_OUT_OF_RANGE',
    },
    '08001': {
      message: 'Service temporarily unavailable',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'SERVICE_UNAVAILABLE',
    },
    '08006': {
      message: 'Service connection lost',
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'CONNECTION_LOST',
    },
    // MySQL error codes
    '1062': {
      message: 'This record already exists',
      statusCode: HttpStatus.CONFLICT,
      error: 'DUPLICATE_RECORD',
    },
    '1452': {
      message: 'Invalid reference provided',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'INVALID_REFERENCE',
    },
    '1451': {
      message: 'Cannot delete record as it is being used',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'RECORD_IN_USE',
    },
    '1406': {
      message: 'Data value is too long',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'DATA_TOO_LONG',
    },
    '1048': {
      message: 'Required field cannot be empty',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'REQUIRED_FIELD_MISSING',
    },
    '1264': {
      message: 'Value is out of acceptable range',
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'VALUE_OUT_OF_RANGE',
    },
  };

  canHandle(error: Error): boolean {
    return error instanceof QueryFailedError;
  }

  handle(error: QueryFailedError, requestId: string): ErrorResponse {
    const driverError = error.driverError as any;
    const errorCode = driverError?.code || driverError?.errno?.toString();

    // Get error mapping or use default
    const errorInfo = this.errorCodeMap[errorCode] || {
      message: 'An error occurred while processing your request',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'DATABASE_ERROR',
    };

    const baseResponse = this.createBaseResponse(
      errorInfo.statusCode,
      errorInfo.statusCode >= 500 ? 'DATABASE_ERROR' : errorInfo.error,

      errorInfo.message,
      requestId,
    );

    return {
      ...baseResponse,
      context: {
        ...baseResponse.context,
        details: error,
      },
    };
  }
}
