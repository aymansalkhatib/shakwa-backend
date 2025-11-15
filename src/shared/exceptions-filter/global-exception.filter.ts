import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ErrorHandlerFactory } from './error-handler.factory';

/**
 * Global exception filter that handles all unhandled exceptions in the application
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorHandlerFactory: ErrorHandlerFactory) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Generate a unique trace ID for error tracking
    const traceId = randomUUID();

    // const developerMode: boolean =
    //   requests.headers['developer-mode'] === 'true' && process.env.NODE_ENV === 'development';

    const developerMode = true;

    try {
      // Get the appropriate handler for this type of error
      const handler = this.errorHandlerFactory.getHandler(exception);

      const errorResponse = handler.handle(exception, traceId);

      // Add stack trace in development
      if (developerMode) {
        errorResponse.stack = exception.stack;
      }

      // Log the error with requests context
      this.logError(exception);

      // Send responses

      if (developerMode) {
        response.status(errorResponse.statusCode).json(errorResponse);
      } else {
        response.status(errorResponse.statusCode).json({
          status: errorResponse.status,
          message: errorResponse.message,
        });
      }
    } catch (error: any) {
      // Handle errors that occur during error handling
      // this.logger.error('Error in exception filter', {
      //   error,
      //   traceId,
      //   responseTime: new Date().toISOString(),
      // });

      console.error(error.toString());
      if (developerMode) {
        response.status(500).json({
          status: 'error',
          message: 'An unexpected error occurred',
          statusCode: 500,
          traceId,
          timestamp: new Date().toISOString(),
          context: {
            code: 'INTERNAL_SERVER_ERROR',
            details: error?.message,
          },
        });
      } else {
        response.status(500).json({
          status: 'error',
          message: 'An unexpected error occurred',
        });
      }
    }
  }

  private logError(exception: Error): void {
    // this.logger.error(`Request failed: ${requests.method} ${requests.url}`, {
    //   ...metadata,
    //   statusCode: status,
    //   levelLog: 'ERROR',
    //   error: {
    //     name: exception.name,
    //     message: exception.message,
    //     stack: exception.stack,
    //   },
    //   traceId,
    // });
    console.error(exception.stack.toString());
  }
}
