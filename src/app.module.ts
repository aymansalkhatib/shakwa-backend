// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadModule } from './app/upload-example/upload.module';
import { AppConfigModule } from './config/config.module';
import { ConfigExampleModule } from './app/config-example/config-example.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [AppConfigModule, LoggerModule, UploadModule, ConfigExampleModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
