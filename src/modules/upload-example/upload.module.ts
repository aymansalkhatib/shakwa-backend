import { Module } from '@nestjs/common';
import { UploadControllerExample } from './upload.controller';
import { UploadServiceExample } from './upload.service';

@Module({
  //
  imports: [],
  //
  controllers: [UploadControllerExample],
  //
  providers: [UploadServiceExample],
})
export class UploadModuleExample {}
