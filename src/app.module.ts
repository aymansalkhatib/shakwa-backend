// ========================================
// NestJS Core Imports
// ========================================
import {
  ArgumentsHost,
  ClassSerializerInterceptor,
  HttpStatus,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

// ========================================
// Third-Party Imports
// ========================================
import {
  i18nValidationErrorFactory,
  I18nValidationException,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';

// ========================================
// Application Core
// ========================================
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ========================================
// Common (Guards, Interceptors, Middlewares)
// ========================================
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { CamelCaseMiddleware } from './common/middlewares/camel-case.middleware';
import { ParseQueryMiddleware } from './common/middlewares/parse-query.middleware';

// ========================================
// Health Check (for Kubernetes probes)
// ========================================
import { HealthModule } from './common/health/health.module';

// ========================================
// Feature Modules
// ========================================
import { AuthModule } from './modules/auth/auth.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { ComplaintsModule } from './modules/your-bucket-name';
import { UploadModule } from './modules/uploads/upload.module';

// ========================================
// Shared Modules & Services
// ========================================
import { ErrorHandlerFactory } from './shared/exceptions-filter/error-handler.factory';
import { GlobalExceptionFilter } from './shared/exceptions-filter/global-exception.filter';
import { AppConfigModule } from './shared/modules/app-config/app-config.module';
import { AppI18nModule } from './shared/modules/app-i18n/i18n.module';
import { AppJwtModule } from './shared/modules/app-jwt/app-jwt.module';
import { AppLoggerModule, LoggingMiddleware } from './shared/modules/app-logger';
import { AppThrottlerModule } from './shared/modules/app-throttler/app-throttler.module';
import { AppTypeOrmModule } from './shared/modules/app-type-orm/app-type-orm.module';
import { RedisModule } from './shared/services/redis';
import { StorageModule } from './shared/services/storage/storage.module';

@Module({
  imports: [
    // Core Infrastructure
    AppConfigModule,
    AppLoggerModule,
    AppI18nModule,
    AppTypeOrmModule,
    AppThrottlerModule,
    AppJwtModule,

    // Health Check (Kubernetes probes)
    HealthModule,

    // Services
    StorageModule,
    RedisModule,

    // Feature Modules
    CitizensModule,
    AuthModule,
    ComplaintsModule,
    UploadModule,
  ],

  controllers: [AppController],

  providers: [
    // ========================================
    // Core Services
    // ========================================
    AppService,
    ErrorHandlerFactory,
    LoggingMiddleware,
    ParseQueryMiddleware,

    // ========================================
    // Global Pipes
    // ========================================
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        exceptionFactory: i18nValidationErrorFactory,
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        stopAtFirstError: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },

    // ========================================
    // Global Filters
    // ========================================

    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    {
      provide: APP_FILTER,
      useValue: new I18nValidationExceptionFilter({
        detailedErrors: false,
        responseBodyFormatter: (
          _host: ArgumentsHost,
          _exc: I18nValidationException,
          formattedErrors: object,
        ) => {
          // Extract the first error message from the formattedErrors object
          const firstError = Object.values(formattedErrors)[0];
          const errorMessage = typeof firstError === 'string' ? firstError : 'Validation failed';

          return {
            statusCode: HttpStatus.BAD_REQUEST,
            errors: 'BAD_REQUEST',
            message: errorMessage,
          };
        },
      }),
    },

    // ========================================
    // Global Interceptors
    // ========================================
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SnakeCaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },

    // ========================================
    // Global Guards
    // ========================================
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware, ParseQueryMiddleware, CamelCaseMiddleware).forRoutes('*');
  }
}
