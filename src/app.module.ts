import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadModuleExample } from './modules/upload-example/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './shared/modules/logging/logger.module';
import { LoggerMiddleware } from './shared/modules/logging/logger.middleware';
import { WinstonLoggerService } from './shared/modules/logging/winston-logger.service';
import { APP_FILTER } from '@nestjs/core';
import { StorageModule } from './shared/modules/storage/storage_model';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
// import { NotificationModule } from './services/notifications/notification.module';
import { I18nModule } from './shared/modules/i18n/i18n.module';
import { AppConfigModel } from './shared/modules/config/app_config.module';
import { MailModule } from './services/mail/mail.module';

@Module({
  imports: [
    AppConfigModel,
    LoggerModule,
    UploadModuleExample,
    // NotificationModule,
    I18nModule,

    StorageModule.register({ provider: 'local' }),
    MailModule,
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
