import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadModuleExample } from './app/upload-example/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { AppConfigModel } from './config/app_config.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [AppConfigModel, LoggerModule, UploadModuleExample],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
