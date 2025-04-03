import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';
 
/**
 * Global module for logging functionality
 */
@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class LoggerModule {}
