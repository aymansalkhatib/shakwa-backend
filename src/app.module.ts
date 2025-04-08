import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadModuleExample } from './app/upload-example/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logging/logger.module';
import { LoggerMiddleware } from './common/logging/logger.middleware';
import { AppConfigModel } from './config/app_config.module';
import { WinstonLoggerService } from './common/logging/winston-logger.service';
import { ErrorHandlerFactory } from './common/filters/error-handler.factory';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [AppConfigModel, LoggerModule, UploadModuleExample],
  controllers: [AppController],
  providers: [
    AppService,
    WinstonLoggerService,
    ErrorHandlerFactory,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
