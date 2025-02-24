import { Global, Module } from '@nestjs/common';
import { CustomLogger } from './logger.service';
import { SimpleLogger } from './simple_logger';

@Global()
@Module({
  providers: [CustomLogger,SimpleLogger],
  exports: [CustomLogger,SimpleLogger],
})
export class LoggerModule {}
