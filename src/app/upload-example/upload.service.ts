import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  // Handle single image upload
  uploadSingleImage(file: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return `File uploaded:  ${file.originalname}`;
  }

  // Handle array of images upload
  uploadMultipleImages(files: Express.Multer.File[]): string[] {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded.');
    }

    return files.map((file) => file.originalname);
  }

  // Handle uploading any file types
  uploadAnyFiles(files: Express.Multer.File[]): Record<string, string[]> {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded.');
    }

    const groupedFiles: Record<string, string[]> = {};

    files.forEach((file) => {
      if (!groupedFiles[file.fieldname]) {
        groupedFiles[file.fieldname] = [];
      }
      groupedFiles[file.fieldname].push(file.originalname);
    });

    return groupedFiles;
  }

  multipleFiles(
    files: Record<string, Express.Multer.File[]>,
  ): Record<string, string[]> {
    const response: Record<string, string[]> = {};

    for (const field in files) {
      if (files[field]) {
        response[field] = files[field].map((file) => file.originalname);
      }
    }

    return response;
  }
}
