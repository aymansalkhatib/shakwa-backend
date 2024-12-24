// app.module.ts
import { Module } from '@nestjs/common';
import { UploadModule } from './app/upload-example/upload.module';
import { AppConfigModule } from './config/config.module';
import { ConfigExampleModule } from './app/config-example/config-example.module';

@Module({
  imports: [AppConfigModule, UploadModule, ConfigExampleModule],
})
export class AppModule {}
