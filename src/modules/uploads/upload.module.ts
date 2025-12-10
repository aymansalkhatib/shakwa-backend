import { StorageModule } from '../../shared/services/storage';
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

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
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
