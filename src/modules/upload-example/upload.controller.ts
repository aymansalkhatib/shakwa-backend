import {
  Controller,
  Inject,
  Post,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { STORAGE_CONSTANTS } from 'src/shared/storage/constants/storage.constants';
import {
  AnyFilesUpload,
  MultipleFieldFilesUpload,
  MultipleFilesUpload,
  SingleFileUpload,
} from 'src/shared/storage/decorators/upload.decorator';
import { LocalStorageService } from 'src/shared/storage/local-storage.service';
import { ImageProcessingPipe } from 'src/shared/storage/pipes/image-processing.pipe';
import { CustomFileParsingPipe } from 'src/shared/storage/pipes/parse-file.pipe';
import { UploadServiceExample } from './upload.service';
import { FirebaseNotificationService } from 'src/services/notifications/firebase-notification.service';

@Controller('upload')
export class UploadControllerExample {
  constructor(
    private readonly fcm: FirebaseNotificationService,
    private readonly uploadService: UploadServiceExample,
    @Inject(STORAGE_CONSTANTS.STORAGE_PROVIDER_SERVICE)
    private readonly localStorageService: LocalStorageService,
  ) {}

  /**
   * Handles the upload of a single file.
   *
   * @param file The uploaded file.
   * @returns A message indicating success and file details.
   */
  @Post('upload-single-file')
  @SingleFileUpload('image')
  async uploadSingleFile(
    @UploadedFile(CustomFileParsingPipe)
    file: Express.Multer.File,
  ) {
    return await this.localStorageService.store(file, 'ayman');
  }

  /**
   * Handles the upload of multiple files.
   *
   * @param files The uploaded files.
   * @returns A response containing the result of the upload process.
   */
  @Post('upload-multiple-files')
  @MultipleFilesUpload('files', 2)
  async uploadMultipleFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Express.Multer.File[],
  ) {
    // Upload multiple files via the upload service.
    return this.uploadService.uploadMultipleFiles(files);
  }

  /**
   * Handles the upload of any type of files.
   *
   * @param files The uploaded files.
   * @returns A response indicating success or failure of the upload.
   */
  @Post('upload-any-files')
  @AnyFilesUpload()
  async uploadAnyFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Express.Multer.File[],
  ) {
    // Upload any type of files via the upload service.
    return this.uploadService.uploadAnyFiles(files);
  }

  /**
   * Handles the upload of multiple types of files (e.g., images, videos, documents, etc.).
   *
   * @param files A map of multiple file fields.
   * @returns A response containing the result of the multi-file upload.
   */
  @Post('upload-multiple-types-of-files')
  @MultipleFieldFilesUpload([
    { name: 'files', maxCount: 2 },
    { name: 'documents', maxCount: 1 },
    { name: 'videos', maxCount: 5 },
    { name: 'audio', maxCount: 3 },
  ])
  async uploadMultipleTypesOfFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Record<string, Express.Multer.File[]>,
  ) {
    // Upload the multiple files using the service.
    return this.uploadService.uploadMultipleTypesOfFiles(files);
  }
}
