import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../shared/services/storage/storage.service';
import { FileInfoDto } from './dtos';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async uploadSingleFile(file: Express.Multer.File): Promise<FileInfoDto[]> {
    const result = await this.storageService.upload(file.buffer, {
      path: `${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
    });

    return [
      {
        url: result.url,
        size: file.size,
        mimeType: file.mimetype,
        fieldName: file.fieldname,
      },
    ];
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<FileInfoDto[]> {
    const uploadResults = await this.storageService.uploadMultiple({
      files: files.map((file) => ({
        file: file.buffer,
        path: `${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    return files.map((file, index) => ({
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
    }));
  }

  async uploadAnyFiles(files: Express.Multer.File[]): Promise<FileInfoDto[]> {
    const uploadResults = await this.storageService.uploadMultiple({
      files: files.map((file) => ({
        file: file.buffer,
        path: `${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    return files.map((file, index) => ({
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
    }));
  }

  async uploadMultipleTypesOfFiles(
    files: Record<string, Express.Multer.File[]>,
  ): Promise<FileInfoDto[]> {
    const allFiles: Express.Multer.File[] = [];
    Object.values(files).forEach((fileArray) => {
      allFiles.push(...fileArray);
    });

    const uploadResults = await this.storageService.uploadMultiple({
      files: allFiles.map((file) => ({
        file: file.buffer,
        path: `${file.fieldname}/${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    return allFiles.map((file, index) => ({
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
    }));
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

  async replaceFile(oldFilePath: string, newFile: Express.Multer.File): Promise<FileInfoDto[]> {
    try {
      await this.storageService.delete(oldFilePath);
    } catch (error) {
      // Ignore if old file doesn't exist
    }

    return this.uploadSingleFile(newFile);
  }

  async getFileUrl(filePath: string): Promise<string> {
    return this.storageService.getUrl(filePath);
  }
}
