import { Global, Module } from '@nestjs/common';
import { LoggingMiddleware } from '../../../common/middlewares/logging.middleware';
import { AppLogger } from './app-logger.service';

@Global()
@Module({
  providers: [AppLogger, LoggingMiddleware],
  exports: [AppLogger, LoggingMiddleware],
})
export class AppLoggerModule {}
