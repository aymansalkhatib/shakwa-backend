import { Module } from '@nestjs/common';
import { UploadControllerExample } from './upload.controller';
import { UploadServiceExample } from './upload.service';
import {
  DEFAULT_FILE_VALIDATION_OPTIONS,
  FIELD_FILE_TYPE_CONSTRAINTS,
  FILE_SIZE_LIMITS,
  FILE_VALIDATION_CONFIG,
  StorageModule,
} from '@app/shared/services/storage';

/**
 * Upload Example Module
 *
 * This module provides example implementations for various file upload scenarios.
 * It demonstrates:
 * - Single file uploads
 * - Multiple file uploads
 * - Multi-field file uploads
 * - File validation and processing
 *
 * The module uses custom decorators and pipes for file handling:
 * - Custom upload decorators for different upload patterns
 * - File validation pipes (CustomFileParsingPipe)
 * - Image processing pipes (ImageProcessingPipe)
 *
 * All endpoints return structured DTOs with comprehensive file metadata.
 */
@Module({
  imports: [StorageModule],
  controllers: [UploadControllerExample],
  providers: [
    UploadServiceExample,
    {
      provide: FILE_VALIDATION_CONFIG,
      useValue: {
        isFileRequired: true, // By default, a file is required
        allowedFileTypes: ['png', 'jpg', 'jpeg'], // Default allowed file types (images)
        globalMaxFileSize: '5MB', // Default max file size for all file types
        perTypeSizeLimits: FILE_SIZE_LIMITS, // specific limits by type by default
      },
    },
  ],
  exports: [UploadServiceExample],
})
export class UploadModuleExample {}
