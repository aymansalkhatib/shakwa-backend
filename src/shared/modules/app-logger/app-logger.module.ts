import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { LoggingMiddleware } from './logging.middleware';

@Global()
@Module({
  providers: [AppLogger, LoggingMiddleware],
  exports: [AppLogger, LoggingMiddleware],
})
export class AppLoggerModule {}
