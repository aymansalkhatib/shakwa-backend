import { ArgumentsHost, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import {
  I18nValidationException,
  I18nValidationExceptionFilter,
  i18nValidationErrorFactory,
} from 'nestjs-i18n';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppLogger } from './shared/modules/app-logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: ['error', 'debug', 'log', 'verbose', 'fatal'],
  });

  // Get logger instance
  const logger = app.get(AppLogger);

  // Enable CORS
  app.enableCors();

  // Apply security headers
  app.use(helmet());

  // Enable compression
  app.use(compression());

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: i18nValidationErrorFactory,
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
      responseBodyFormatter: (
        _host: ArgumentsHost,
        _exc: I18nValidationException,
        formattedErrors: object,
      ) => {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          errors: 'BAD_REQUEST',
          message: formattedErrors[0],
        };
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix('api');

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection', reason?.stack || String(reason), 'Process');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', err.stack || err.message, 'Process');
  });
}

bootstrap();
