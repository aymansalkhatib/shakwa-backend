import { Module } from '@nestjs/common';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  DEFAULT_FILE_VALIDATION_OPTIONS,
} from './constants/file-validation';
import {
  FILE_VALIDATION_CONFIG,
  IMAGE_COMPRESSION_CONFIG,
  STORAGE_PROVIDER_SERVICE,
} from './constants/storage.token';
import { ImageProcessingPipe } from './pipes/image-processing.pipe';
import { CustomFileParsingPipe } from './pipes/parse-file.pipe';
import { LocalStorageProvider } from './providers/local/local-storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [
    {
      provide: IMAGE_COMPRESSION_CONFIG,
      useValue: DEFAULT_COMPRESSION_OPTIONS,
    },
    {
      provide: FILE_VALIDATION_CONFIG,
      useValue: DEFAULT_FILE_VALIDATION_OPTIONS,
    },
    {
      provide: STORAGE_PROVIDER_SERVICE,
      useClass: LocalStorageProvider,
    },

    ImageProcessingPipe,
    CustomFileParsingPipe,
    // FirebaseAdminProvider,
    StorageService,
  ],
  exports: [
    StorageService,
    ImageProcessingPipe,
    CustomFileParsingPipe,
    IMAGE_COMPRESSION_CONFIG,
    FILE_VALIDATION_CONFIG,
    STORAGE_PROVIDER_SERVICE,
  ],
})
export class StorageModule {}
