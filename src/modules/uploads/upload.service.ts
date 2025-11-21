import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../shared/services/storage/storage.service';
import {
  SingleFileUploadResponseDto,
  MultipleFilesUploadResponseDto,
  AnyFilesUploadResponseDto,
  MultipleTypesUploadResponseDto,
  DeleteFileResponseDto,
  DeleteMultipleFilesResponseDto,
} from './dto/upload-response.dto';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async uploadSingleFile(file: Express.Multer.File): Promise<SingleFileUploadResponseDto> {
    const result = await this.storageService.upload(file.buffer, {
      path: `uploads/${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
    });

    return {
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: file.originalname,
        filename: result.path.split('/').pop(),
        path: result.path,
        url: result.url,
        size: file.size,
        mimeType: file.mimetype,
      },
    };
  }

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<MultipleFilesUploadResponseDto> {
    const uploadResults = await this.storageService.uploadMultiple({
      files: files.map((file) => ({
        file: file.buffer,
        path: `uploads/${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    const uploadedFiles = files.map((file, index) => ({
      originalName: file.originalname,
      filename: uploadResults[index].path.split('/').pop(),
      path: uploadResults[index].path,
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
    }));

    return {
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: uploadedFiles,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };
  }

  async uploadAnyFiles(files: Express.Multer.File[]): Promise<AnyFilesUploadResponseDto> {
    const uploadResults = await this.storageService.uploadMultiple({
      files: files.map((file) => ({
        file: file.buffer,
        path: `uploads/${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    const uploadedFiles = files.map((file, index) => ({
      originalName: file.originalname,
      filename: uploadResults[index].path.split('/').pop(),
      path: uploadResults[index].path,
      url: uploadResults[index].url,
      size: file.size,
      mimeType: file.mimetype,
      fieldName: file.fieldname,
    }));

    const filesByField = uploadedFiles.reduce((acc, file) => {
      if (!acc[file.fieldName]) {
        acc[file.fieldName] = [];
      }
      acc[file.fieldName].push(file);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: uploadedFiles,
      filesByField,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };
  }

  async uploadMultipleTypesOfFiles(
    files: Record<string, Express.Multer.File[]>,
  ): Promise<MultipleTypesUploadResponseDto> {
    const allFiles: Express.Multer.File[] = [];
    Object.values(files).forEach((fileArray) => {
      allFiles.push(...fileArray);
    });

    const uploadResults = await this.storageService.uploadMultiple({
      files: allFiles.map((file) => ({
        file: file.buffer,
        path: `uploads/${file.fieldname}/${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
      })),
    });

    let resultIndex = 0;
    const filesByField: Record<string, any[]> = {};
    let totalSize = 0;

    for (const [fieldName, fileArray] of Object.entries(files)) {
      filesByField[fieldName] = fileArray.map((file) => {
        const result = uploadResults[resultIndex++];
        totalSize += file.size;
        return {
          originalName: file.originalname,
          filename: result.path.split('/').pop(),
          path: result.path,
          url: result.url,
          size: file.size,
          mimeType: file.mimetype,
        };
      });
    }

    return {
      success: true,
      message: `${allFiles.length} files uploaded successfully across ${Object.keys(files).length} fields`,
      filesByField,
      totalFiles: allFiles.length,
      totalSize,
      fieldCount: Object.keys(files).length,
    };
  }

  async deleteFile(filePath: string): Promise<DeleteFileResponseDto> {
    try {
      await this.storageService.delete(filePath);
      return {
        success: true,
        message: 'File deleted successfully',
        deletedPath: filePath,
      };
    } catch (error) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<DeleteMultipleFilesResponseDto> {
    await this.storageService.deleteMultiple({ paths: filePaths });

    return {
      success: true,
      message: `${filePaths.length} files deleted successfully`,
      deletedPaths: filePaths,
      totalDeleted: filePaths.length,
    };
  }

  async replaceFile(
    oldFilePath: string,
    newFile: Express.Multer.File,
  ): Promise<SingleFileUploadResponseDto> {
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
