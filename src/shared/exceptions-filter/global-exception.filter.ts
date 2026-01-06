import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../modules/app-logger/app-logger.service';
import { ErrorHandlerFactory } from './error-handler.factory';
import { ErrorResponse } from './interfaces/error-response.interface';

/**
 * Global exception filter that handles all unhandled exceptions in the application
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly errorHandlerFactory: ErrorHandlerFactory,
    private readonly logger: AppLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.requestId;

    // Determine developer mode based on environment and headers
    const isDevelopment = process.env.NODE_ENV === 'development';
    const devModeHeader = request.headers['x-developer-mode'] === 'true';
    const developerMode = isDevelopment && devModeHeader;

    try {
      // Get the appropriate handler for this type of error
      const handler = this.errorHandlerFactory.getHandler(exception);

      const errorResponse = handler.handle(exception, requestId);

      // Add stack trace in development
      if (errorResponse.context) {
        errorResponse.context.stack = exception.stack;
      }

      // Log the error with request context
      this.logError(errorResponse, exception, request);

      if (!developerMode) {
        errorResponse.context = undefined;
      }

      // Send responses
      response.status(errorResponse.statusCode).json(errorResponse);

      //
    } catch (error: any) {
      //
      const fallbackResponse: ErrorResponse = {
        statusCode: 500,
        errors: 'Internal Server Error',
        message: 'An unexpected error occurred',
        ...(developerMode && {
          context: {
            requestId,
            timestamp: new Date().toISOString(),
            details: error?.message,
            stack: error?.stack,
          },
        }),
      };

      this.logError(fallbackResponse, exception, request);

      response.status(500).json(fallbackResponse);
    }
  }

  private logError(errorResponse: ErrorResponse, originalException?: any, request?: Request): void {
    const logContext = {
      context: 'GlobalExceptionFilter',
      requestId: errorResponse.context?.requestId,
      statusCode: errorResponse.statusCode,
      error: {
        name: originalException?.name || 'Unknown',
        message: errorResponse.message,
        errors: errorResponse.errors,
        stack: originalException?.stack || errorResponse.context?.stack,
      },
      ...(request && {
        method: request.method,
        url: request.originalUrl || request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        query: Object.keys(request.query || {}).length > 0 ? request.query : undefined,
        params: Object.keys(request.params || {}).length > 0 ? request.params : undefined,
      }),
      timestamp: errorResponse.context?.timestamp || new Date().toISOString(),
      ...(errorResponse.context?.details && { details: errorResponse.context.details }),
    };

    // Log based on status code severity
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `Request failed: ${request?.method || 'UNKNOWN'} ${request?.originalUrl || request?.url || 'UNKNOWN'}`,
        originalException?.stack || errorResponse.context?.stack,
        logContext,
      );
    } else if (errorResponse.statusCode >= 400) {
      // this.logger.warn(
      //   `Request client error: ${request?.method || 'UNKNOWN'} ${request?.originalUrl || request?.url || 'UNKNOWN'}`,
      //   logContext,
      // );
    } else {
      this.logger.error(
        `Request error: ${request?.method || 'UNKNOWN'} ${request?.originalUrl || request?.url || 'UNKNOWN'}`,
        originalException?.stack || errorResponse.context?.stack,
        logContext,
      );
    }
  }
}
