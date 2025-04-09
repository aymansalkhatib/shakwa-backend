import { Module } from '@nestjs/common';
import { UploadControllerExample } from './upload.controller';
import { UploadServiceExample } from './upload.service';
import { ImageProcessingPipe } from 'src/common/files/pipes/image-processing.pipe';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  DEFAULT_FILE_VALIDATION_OPTIONS,
} from 'src/common/files/constants/file.constants';
import {
  FileValidationOptions,
  ImageCompressionOptions,
} from 'src/common/files/types/file.types';
import { CustomFileParsingPipe } from 'src/common/files/pipes/parse-file.pipe';

@Module({
  imports: [],
  controllers: [UploadControllerExample],
  providers: [
    //
    UploadServiceExample,
    //
    {
      provide: 'IMAGE_COMPRESSION_OPTIONS',
      useValue: {
        ...DEFAULT_COMPRESSION_OPTIONS,
        // Allow overriding options if needed
        ...({} as Partial<ImageCompressionOptions>),
      },
    },
    //
    {
      provide: 'FILE_VALIDATION_OPTIONS',
      useValue: {
        ...DEFAULT_FILE_VALIDATION_OPTIONS,
        // Allow overriding options if needed
        ...({} as Partial<FileValidationOptions>),
      },
    },
    //
    ImageProcessingPipe,

    CustomFileParsingPipe,
    //
  ],
})
export class UploadModuleExample {}
