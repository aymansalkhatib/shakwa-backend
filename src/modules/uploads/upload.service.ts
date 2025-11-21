import { Injectable, NotFoundException } from '@nestjs/common';
import { createUniqueFileName, UploadResult } from '../../shared/services/storage';
import { StorageService } from '../../shared/services/storage/storage.service';
import { FileInfoDto } from './dtos';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async uploadSingleFile(file: Express.Multer.File): Promise<FileInfoDto[]> {
    return this.uploadFiles([file]);
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<FileInfoDto[]> {
    return this.uploadFiles(files);
  }

  async uploadAnyFiles(files: Express.Multer.File[]): Promise<FileInfoDto[]> {
    return this.uploadFiles(files);
  }

  async uploadMultipleTypesOfFiles(
    files: Record<string, Express.Multer.File[]>,
  ): Promise<FileInfoDto[]> {
    const allFiles = Object.values(files).flat();
    return this.uploadFiles(allFiles);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.storageService.delete(filePath);
    } catch (error) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    await this.storageService.deleteMultiple({ paths: filePaths });
  }

  async getFileUrl(filePath: string): Promise<string> {
    return this.storageService.getUrl(filePath);
  }

  /**
   * Prepare files for upload by mapping them to storage options
   */
  private prepareFilesForUpload(files: Express.Multer.File[]) {
    return files.map((file) => ({
      file: file.buffer,
      path: createUniqueFileName(file.originalname),
      mimeType: file.mimetype,
    }));
  }

  /**
   * Map upload results to FileInfoDto
   */
  private mapToFileInfoDto(
    files: Express.Multer.File[],
    uploadResults: UploadResult[],
  ): FileInfoDto[] {
    return files.map((file, index) => ({
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
    }));
  }

  /**
   * Upload files and return FileInfoDto array
   */
  private async uploadFiles(files: Express.Multer.File[]): Promise<FileInfoDto[]> {
    const uploadResults = await this.storageService.uploadMultiple({
      files: this.prepareFilesForUpload(files),
    });

    return this.mapToFileInfoDto(files, uploadResults);
  }
}
