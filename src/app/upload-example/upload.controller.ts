import { Controller, Post, UploadedFile, UploadedFiles } from '@nestjs/common';

import { UploadServiceExample } from './upload.service';
import { CustomFileParsingPipe } from 'src/common/files/pipes/parse-file.pipe';
import { ImageProcessingPipe } from 'src/common/files/pipes/image-processing.pipe';
import { join } from 'path';
import { promises as fs } from 'fs';
import {
  AnyFilesUpload,
  MultipleFieldFilesUpload,
  MultipleFilesUpload,
  SingleFileUpload,
} from 'src/common/files/decorators/upload.decorator';

@Controller('upload')
export class UploadControllerExample {
  constructor(private readonly uploadService: UploadServiceExample) {}

  /**
   * Handles the upload of a single file.
   *
   * @param file The uploaded file.
   * @returns A message indicating success and file details.
   */
  @Post('upload-single-file')
  @SingleFileUpload('image')
  async uploadSingleFile(
    @UploadedFile(CustomFileParsingPipe, ImageProcessingPipe)
    file: Express.Multer.File,
  ) {
    // Define the directory to save the uploaded file.
    const uploadDirectory = join(__dirname, '..', 'uploads');
    await fs.mkdir(uploadDirectory, { recursive: true });

    const fileName = file.originalname;
    const filePath = join(uploadDirectory, fileName);

    // Save the file to the server's filesystem.
    await fs.writeFile(filePath, file.buffer);

    // Return a response with file information.
    return {
      message: 'File uploaded and saved successfully.',
      fileName,
      path: filePath,
      name: file.originalname,
      size: file.size,
    };
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
