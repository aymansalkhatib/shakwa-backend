import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { ParseQueryMiddleware } from './common/middlewares/parse-query.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { AppConfigModule } from './shared/modules/app-config/app-config.module';
import { AppI18nModule } from './shared/modules/app-i18n/i18n.module';
import { AppJwtModule } from './shared/modules/app-jwt/app-jwt.module';
import { AppLoggerModule, LoggingMiddleware } from './shared/modules/app-logger';
import { StorageModule } from './shared/services/storage/storage.module';
import { AppThrottlerModule } from './shared/modules/app-throttler/app-throttler.module';
import { AppTypeOrmModule } from './shared/modules/app-type-orm/app-type-orm.module';
import { RedisModule } from './shared/services/redis';
import { ComplaintsModule } from './modules/your-bucket-name';
import { UploadModule } from './modules/uploads/upload.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    AppI18nModule,
    AppTypeOrmModule,
    AppThrottlerModule,
    AppJwtModule,
    StorageModule,
    RedisModule,
    CitizensModule,
    AuthModule,
    ComplaintsModule,
    UploadModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    ErrorHandlerFactory,
    LoggingMiddleware,
    ParseQueryMiddleware,
    // // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global Serializer Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    // Global Rate Limiting with Custom Guard
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, ParseQueryMiddleware).forRoutes('/');
  }
}
