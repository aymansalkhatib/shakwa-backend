import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppLogger } from './shared/modules/app-logger';

async function bootstrap() {
  // ========================================
  // Application Initialization
  // ========================================
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: ['error', 'debug', 'log', 'verbose', 'fatal'],
  });

  const logger = app.get(AppLogger);

  // ========================================
  // Security & Performance
  // ========================================
  app.enableCors();
  app.use(helmet());
  app.use(compression());

  // ========================================
  // API Configuration
  // ========================================
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // ========================================
  // Static Assets
  // ========================================
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // ========================================
  // Server Startup
  // ========================================
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');

  // ========================================
  // Error Handlers
  // ========================================
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection', reason?.stack || String(reason), 'Process');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', err.stack || err.message, 'Process');
  });
}

bootstrap();

// create completint check is images found
//
// unlocke
//
// max size 25 mb
//
// 

