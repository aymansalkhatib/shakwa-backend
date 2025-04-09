import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadModuleExample } from './modules/upload-example/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './shared/logging/logger.module';
import { LoggerMiddleware } from './shared/logging/logger.middleware';
import { AppConfigModel } from './config/app_config.module';
import { WinstonLoggerService } from './shared/logging/winston-logger.service';
import { APP_FILTER } from '@nestjs/core';
import { StorageModule } from './shared/storage/storage_model';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { NotificationModule } from './services/notifications/notification.module';

@Module({
  imports: [
    AppConfigModel,
    LoggerModule,
    UploadModuleExample,

    StorageModule.register({
      provider: 'local',
      options: {
        localConfig: {
          basePath: 'uploads',
        },
      },
    }),
    NotificationModule,
  ],
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
