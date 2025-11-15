import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParseQueryMiddleware } from './common/middlewares/parse-query.middleware';
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { AppConfigModel } from './shared/modules/app-config/app_config.module';
import { AppI18nModule } from './shared/modules/app-i18n/i18n.module';
import { AppJwtModule } from './shared/modules/app-jwt/app-jwt.module';
import { AppStorageModule } from './shared/modules/app-storage/app-storage.module';
import { AppTypeOrmModule } from './shared/modules/app-type-orm/app-type-orm.module';

@Module({
  imports: [
    AppConfigModel,
    AppI18nModule,
    // AppTypeOrmModule,
    // AppJwtModule,
    // AppStorageModule.register({
    //   provider: 'local',
    // }),
    //
  ],

  // controllers: [AppController],

  providers: [
    // AppService,
    // ErrorHandlerFactory,
    // {
    //   provide: APP_FILTER,
    //   useClass: GlobalExceptionFilter,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ClassSerializerInterceptor,
    // },
  ],
})
export class AppModule  {
  // configure(consumer: MiddlewareConsumer) {
    // consumer.apply(ParseQueryMiddleware).forRoutes('*');
  // }
}
