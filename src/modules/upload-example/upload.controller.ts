import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';

import { UploadServiceExample } from './upload.service';
import {
  SingleFileUpload,
  MultipleFilesUpload,
  AnyFilesUpload,
  MultipleFieldFilesUpload,
} from '../../shared/modules/app-storage/decorators/upload.decorator';
import { ImageProcessingPipe } from '../../shared/modules/app-storage/pipes/image-processing.pipe';
import { CustomFileParsingPipe } from '../../shared/modules/app-storage/pipes/parse-file.pipe';
import { SerializeResponse } from '../../common/decorators/serialize-response.decorator';
import {
  SingleFileUploadResponseDto,
  MultipleFilesUploadResponseDto,
  AnyFilesUploadResponseDto,
  MultipleTypesUploadResponseDto,
} from './dto/upload-response.dto';

/**
 * Example controller demonstrating various file upload patterns.
 * This controller showcases different upload scenarios:
 * - Single file upload
 * - Multiple files upload
 * - Any files upload (with field grouping)
 * - Multiple field types upload
 */
@Controller('upload')
export class UploadControllerExample {
  constructor(private readonly uploadService: UploadServiceExample) {}

  /**
   * Handles the upload of a single file.
   * Accepts a single file through the 'image' field.
   *
   * @param file The uploaded file (validated and processed).
   * @returns SingleFileUploadResponseDto with file information and success message.
   */
  @Post('upload-single-file')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUpload('image')
  @SerializeResponse(SingleFileUploadResponseDto)
  async uploadSingleFile(
    @UploadedFile(CustomFileParsingPipe)
    file: Express.Multer.File,
  ): Promise<SingleFileUploadResponseDto> {
    return this.uploadService.uploadSingleFile(file);
  }

  /**
   * Handles the upload of multiple files.
   * Accepts up to 2 files through the 'files' field.
   *
   * @param files The uploaded files array (validated and processed).
   * @returns MultipleFilesUploadResponseDto with files information and statistics.
   */
  @Post('upload-multiple-files')
  @HttpCode(HttpStatus.CREATED)
  @MultipleFilesUpload('files', 2)
  @SerializeResponse(MultipleFilesUploadResponseDto)
  async uploadMultipleFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Express.Multer.File[],
  ): Promise<MultipleFilesUploadResponseDto> {
    return this.uploadService.uploadMultipleFiles(files);
  }

  /**
   * Handles the upload of any type of files from any field.
   * Accepts files from multiple fields and groups them by field name.
   *
   * @param files The uploaded files array (validated and processed).
   * @returns AnyFilesUploadResponseDto with files grouped by field name and statistics.
   */
  @Post('upload-any-files')
  @HttpCode(HttpStatus.CREATED)
  @AnyFilesUpload()
  @SerializeResponse(AnyFilesUploadResponseDto)
  async uploadAnyFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Express.Multer.File[],
  ): Promise<AnyFilesUploadResponseDto> {
    return this.uploadService.uploadAnyFiles(files);
  }

  /**
   * Handles the upload of multiple types of files from different fields.
   * Accepts files from predefined fields: files, documents, videos, and audio.
   *
   * Field limits:
   * - files: max 2
   * - documents: max 1
   * - videos: max 5
   * - audio: max 3
   *
   * @param files A record mapping field names to arrays of uploaded files.
   * @returns MultipleTypesUploadResponseDto with files organized by field and statistics.
   */
  @Post('upload-multiple-types-of-files')
  @HttpCode(HttpStatus.CREATED)
  @MultipleFieldFilesUpload([
    { name: 'files', maxCount: 2 },
    { name: 'documents', maxCount: 1 },
    { name: 'videos', maxCount: 5 },
    { name: 'audio', maxCount: 3 },
  ])
  @SerializeResponse(MultipleTypesUploadResponseDto)
  async uploadMultipleTypesOfFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Record<string, Express.Multer.File[]>,
  ): Promise<MultipleTypesUploadResponseDto> {
    return this.uploadService.uploadMultipleTypesOfFiles(files);
  }
}
