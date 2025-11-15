import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SingleFileUploadResponseDto,
  MultipleFilesUploadResponseDto,
  AnyFilesUploadResponseDto,
  MultipleTypesUploadResponseDto,
  FileInfoDto,
} from './dto/upload-response.dto';

@Injectable()
export class UploadServiceExample {
  /**
   * Converts a Multer file to FileInfoDto
   *
   * @param file The uploaded file from Multer
   * @returns FileInfoDto with file metadata
   */
  private mapFileToDto(file: Express.Multer.File): FileInfoDto {
    return {
      originalName: file.originalname,
      storagePath: file.path,
      size: file.size,
      mimetype: file.mimetype,
      fieldname: file.fieldname,
      uploadedAt: new Date(),
      encoding: file.encoding,
    };
  }

  /**
   * Handles the upload of a single file.
   *
   * @param file The uploaded file.
   * @returns SingleFileUploadResponseDto with file information.
   * @throws BadRequestException if no file is uploaded.
   */
  uploadSingleFile(
    file: Express.Multer.File,
  ): SingleFileUploadResponseDto {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return {
      file: this.mapFileToDto(file),
      message: `File "${file.originalname}" uploaded successfully.`,
    };
  }

  /**
   * Handles the upload of multiple files.
   *
   * @param files The uploaded files.
   * @returns MultipleFilesUploadResponseDto with files information.
   * @throws BadRequestException if no files are uploaded.
   */
  uploadMultipleFiles(
    files: Express.Multer.File[],
  ): MultipleFilesUploadResponseDto {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }

    const fileDtos = files.map((file) => this.mapFileToDto(file));
    const totalSize = fileDtos.reduce((sum, file) => sum + file.size, 0);

    return {
      files: fileDtos,
      totalFiles: fileDtos.length,
      totalSize,
      message: `Successfully uploaded ${fileDtos.length} file(s).`,
    };
  }

  /**
   * Handles the upload of any type of files and groups them by their field name.
   *
   * @param files The uploaded files.
   * @returns AnyFilesUploadResponseDto with files grouped by field name.
   * @throws BadRequestException if no files are uploaded.
   */
  uploadAnyFiles(
    files: Express.Multer.File[],
  ): AnyFilesUploadResponseDto {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded.');
    }

    const filesByField: Record<string, FileInfoDto[]> = {};
    let totalSize = 0;

    files.forEach((file) => {
      const fileDto = this.mapFileToDto(file);
      totalSize += fileDto.size;

      if (!filesByField[file.fieldname]) {
        filesByField[file.fieldname] = [];
      }
      filesByField[file.fieldname].push(fileDto);
    });

    return {
      filesByField,
      totalFiles: files.length,
      totalSize,
      message: `Successfully uploaded ${files.length} file(s) across ${Object.keys(filesByField).length} field(s).`,
    };
  }

  /**
   * Handles the upload of multiple types of files.
   *
   * @param files A record where keys are field names and values are arrays of files.
   * @returns MultipleTypesUploadResponseDto with files organized by field name.
   * @throws BadRequestException if no files are uploaded.
   */
  uploadMultipleTypesOfFiles(
    files: Record<string, Express.Multer.File[]>,
  ): MultipleTypesUploadResponseDto {
    if (!files || Object.keys(files).length === 0) {
      throw new BadRequestException('No files uploaded.');
    }

    const filesByField: Record<string, FileInfoDto[]> = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const field in files) {
      if (files[field] && files[field].length > 0) {
        filesByField[field] = files[field].map((file) => {
          const fileDto = this.mapFileToDto(file);
          totalSize += fileDto.size;
          totalFiles++;
          return fileDto;
        });
      }
    }

    return {
      filesByField,
      totalFiles,
      totalSize,
      fieldCount: Object.keys(filesByField).length,
      message: `Successfully uploaded ${totalFiles} file(s) across ${Object.keys(filesByField).length} field type(s).`,
    };
  }
}
