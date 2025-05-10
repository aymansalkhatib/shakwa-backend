import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ErrorHandlerFactory } from './error-handler.factory';
import { extractRequestMetadata, getErrorStatus } from './utils/request-metadata.util';
import { LogMetadata } from '../modules/app-logging/interfaces/logger.interface';
import { WinstonLoggerService } from '../modules/app-logging/winston-logger.service';

/**
 * Global exception filter that handles all unhandled exceptions in the application
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly errorHandlerFactory: ErrorHandlerFactory,
    private readonly logger: WinstonLoggerService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique trace ID for error tracking
    const traceId = randomUUID();

    try {
      // Get the appropriate handler for this type of error
      const handler = this.errorHandlerFactory.getHandler(exception);

      const errorResponse = handler.handle(exception, traceId);

      // Add stack trace in development
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = exception.stack;
      }

      // Log the error with request context
      this.logError(request, exception, traceId);

      // Send response
      const { statusCode, ...responseBody } = errorResponse;
      response.status(statusCode).json(responseBody);
    } catch (error) {
      // Handle errors that occur during error handling
      this.logger.error('Error in exception filter', {
        error,
        traceId,
        responseTime: new Date().toISOString(),
      });

      response.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
        traceId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private logError(request: Request, exception: Error, traceId: string): void {
    const metadata: LogMetadata = extractRequestMetadata(request);
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
      traceId,
    });
  }
}
