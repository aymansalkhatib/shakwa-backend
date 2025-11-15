import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { ParseQueryMiddleware } from './common/middlewares/parse-query.middleware';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { AppConfigModule } from './shared/modules/app-config/app_config.module';
import { AppI18nModule } from './shared/modules/app-i18n/i18n.module';
import { AppStorageModule } from './shared/modules/app-storage/app-storage.module';
import { AppThrottlerModule } from './shared/modules/app-throttler/app-throttler.module';
import { AppTypeOrmModule } from './shared/modules/app-type-orm/app-type-orm.module';

@Module({
  imports: [
    AppConfigModule,
    AppI18nModule,
    AppTypeOrmModule,
    AppThrottlerModule,
    // AppJwtModule,
    AppStorageModule.register({ provider: 'local' }),
  ],

  controllers: [AppController],

  providers: [
    AppService,
    ErrorHandlerFactory,
    // Global Exception Filter
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
    consumer.apply(ParseQueryMiddleware).forRoutes('*');
  }
}
