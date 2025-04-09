import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadServiceExample {
  /**
   * Handles the upload of a single file.
   *
   * @param file The uploaded file.
   * @returns A message with the uploaded file's name.
   * @throws BadRequestException if no file is uploaded.
   */
  uploadSingleFile(file: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return `File uploaded: ${file.originalname}`;
  }

  /**
   * Handles the upload of multiple files.
   *
   * @param files The uploaded files.
   * @returns A list of names of the uploaded files.
   * @throws Error if no files are uploaded.
   */
  uploadMultipleFiles(files: Express.Multer.File[]): string[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }
    return files.map((file) => file.originalname);
  }

  /**
   * Handles the upload of any type of files and groups them by their field name.
   *
   * @param files The uploaded files.
   * @returns A record of field names and their respective file names.
   * @throws Error if no files are uploaded.
   */
  uploadAnyFiles(files: Express.Multer.File[]): Record<string, string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
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

  /**
   * Handles the upload of multiple types of files.
   *
   * @param files A record where keys are field names and values are arrays of files.
   * @returns A record of field names and the list of uploaded file names.
   */
  uploadMultipleTypesOfFiles(
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
