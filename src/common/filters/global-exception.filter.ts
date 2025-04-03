import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { extractRequestMetadata } from './utils/request-metadata.util';
import { getErrorStatus } from './utils/error-handler.util';
import { WinstonLoggerService } from '../logging/winston-logger.service';

interface ErrorResponse {
  status: 'error' | 'failure';
  status_code: number;
  message: string | string[];
  data?: any;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly startTime: number;

  constructor(private readonly logger: WinstonLoggerService) {
    this.startTime = Date.now();
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let errorResponse: ErrorResponse = {
      status: 'error',
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };

    // Handle different types of errors
    if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception);
    } else if (exception instanceof MulterError) {
      errorResponse = this.handleMulterError(exception);
    } else if (exception instanceof JsonWebTokenError) {
      errorResponse = this.handleJwtError();
    } else if (exception instanceof TokenExpiredError) {
      errorResponse = this.handleTokenExpiredError();
    }

    // else if (exception instanceof MongoError) {
    //   errorResponse = this.handleMongoError(exception);
    // } else if (exception instanceof MongooseError.CastError) {
    //   errorResponse = this.handleMongooseCastError(exception);
    // }

    // Add stack trace in development environment
    if ((process.env.NODE_ENV || 'development') === 'development') {
      errorResponse.stack = exception.stack;
    }

    // Log the error
    this.logError(request, errorResponse, exception);

    // Send response

    const status = errorResponse.status_code;
    delete errorResponse.status_code;
    response.status(status).json(errorResponse);
  }

  private handleHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse() as any;

    return {
      status: status >= 500 ? 'error' : 'failure',
      status_code: status,
      message: response.message || exception.message,
      data: response.data,
    };
  }

  private handleMulterError(error: MulterError): ErrorResponse {
    const messages: { [key: string]: string } = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_PART_COUNT: 'Too many parts',
    };

    return {
      status: 'failure',
      status_code: HttpStatus.BAD_REQUEST,
      message: messages[error.code] || 'File upload error',
    };
  }

  private handleJwtError(): ErrorResponse {
    return {
      status: 'failure',
      status_code: HttpStatus.UNAUTHORIZED,
      message: 'Invalid token signature',
    };
  }

  private handleTokenExpiredError(): ErrorResponse {
    return {
      status: 'failure',
      status_code: HttpStatus.UNAUTHORIZED,
      message: 'Token has expired',
    };
  }

  // private handleMongoError(error: MongoError): ErrorResponse {
  //   if (error.code === 11000) {
  //     return {
  //       status: 'failure',
  //       status_code: HttpStatus.CONFLICT,
  //       message: 'Duplicate key error',
  //     };
  //   }
  //
  //   return {
  //     status: 'error',
  //     status_code: HttpStatus.INTERNAL_SERVER_ERROR,
  //     message: 'Database error',
  //   };
  // }

  // private handleMongooseCastError(error: MongooseError.CastError): ErrorResponse {
  //   return {
  //     status: 'failure',
  //     status_code: HttpStatus.BAD_REQUEST,
  //     message: `Invalid ${error.kind}: ${error.value}`,
  //   };
  // }

  private logError(
    request: Request,
    errorResponse: ErrorResponse,
    exception: any,
  ): void {
    const metadata = extractRequestMetadata(request, this.startTime);
    const status = getErrorStatus(exception);

    this.logger.error(`Request failed: ${request.method} ${request.url}`, {
      ...metadata,
      statusCode: status,
      levelLog: 'ERROR',
      error: {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      },
    });
  }
}

/*
private readonly startTime: number;

  constructor(private readonly logger: CustomLogger) {
    this.startTime = Date.now();
  }


   const status = getErrorStatus(exception);
    const message = getErrorMessage(exception);

    // Extract real metadata from the request
    const metadata = extractRequestMetadata(request, this.startTime);

    this.logger.error(`Request failed: ${request.method} ${request.url}`, {
      ...metadata,
      statusCode: status,
      error: {
        name: exception.name,
        message: exception.message,
        stack: exception.stack
      }
    });

    const errorResponse: ErrorResponse = {
      status: status >= 500 ? 'error' : 'failure',
      status_code: status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
    };

    response.status(status).json(errorResponse);
* */
