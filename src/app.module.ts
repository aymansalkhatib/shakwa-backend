// app.module.ts
import { Module } from '@nestjs/common';
import { UploadModule } from './app/upload/upload.module';

@Module({
  imports: [UploadModule],
})
export class AppModule {}
