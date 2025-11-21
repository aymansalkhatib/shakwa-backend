import { SerializeResponse } from '@app/common/decorators/serialize-response.decorator';
import {
  AnyFilesUpload,
  DEFAULT_FILE_VALIDATION_OPTIONS,
  MultipleFieldFilesUpload,
  MultipleFilesUpload,
  ProcessedFile,
  ProcessedFiles,
  SingleFileUpload,
} from '@app/shared/services/storage';
import { GroupedFileValidationPipe, ImageProcessingPipe } from '@app/shared/services/storage/pipes';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import {
  DeleteFileDto,
  DeleteMultipleFilesDto,
  FileInfoDto,
  GetFileUrlDto,
  GetFileUrlsDto,
} from './dtos';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @SingleFileUpload('file')
  @SerializeResponse(FileInfoDto)
  async uploadSingle(
    @ProcessedFile()
    file: Express.Multer.File,
  ): Promise<FileInfoDto[]> {
    return this.uploadService.uploadSingleFile(file);
  }

  @Post('multiple')
  @MultipleFilesUpload('files', 10)
  @SerializeResponse(FileInfoDto)
  async uploadMultiple(
    @ProcessedFiles()
    files: Express.Multer.File[],
  ): Promise<FileInfoDto[]> {
    return this.uploadService.uploadMultipleFiles(files);
  }

  @Post('any')
  @AnyFilesUpload({ limits: { files: 20 } })
  @SerializeResponse(FileInfoDto)
  async uploadAny(
    @ProcessedFiles()
    files: Express.Multer.File[],
  ): Promise<FileInfoDto[]> {
    return this.uploadService.uploadAnyFiles(files);
  }

  @Post('grouped')
  @MultipleFieldFilesUpload([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 3 },
    { name: 'videos', maxCount: 2 },
  ])
  @SerializeResponse(FileInfoDto)
  async uploadGrouped(
    @UploadedFiles(
      new GroupedFileValidationPipe({
        images: {
          ...DEFAULT_FILE_VALIDATION_OPTIONS,
          allowedFileTypes: ['jpg', 'jpeg', 'png'],
          globalMaxFileSize: '5MB',
        },
        documents: {
          ...DEFAULT_FILE_VALIDATION_OPTIONS,
          allowedFileTypes: ['pdf', 'txt'],
          globalMaxFileSize: '10MB',
        },
        videos: {
          ...DEFAULT_FILE_VALIDATION_OPTIONS,
          allowedFileTypes: ['mp4'],
          globalMaxFileSize: '50MB',
        },
      }),
      ImageProcessingPipe,
    )
    files: Record<string, Express.Multer.File[]>,
  ): Promise<FileInfoDto[]> {
    return this.uploadService.uploadMultipleTypesOfFiles(files);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Query() dto: DeleteFileDto): Promise<void> {
    return this.uploadService.deleteFile(dto.path);
  }

  @Delete('multiple')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMultiple(@Body() dto: DeleteMultipleFilesDto): Promise<void> {
    return this.uploadService.deleteMultipleFiles(dto.paths);
  }

  @Get('url')
  async getFileUrl(@Query() dto: GetFileUrlDto): Promise<{ url: string }> {
    const url = await this.uploadService.getFileUrl(dto.path);
    return { url };
  }

  @Get('urls')
  async getFileUrls(@Query() dto: GetFileUrlsDto): Promise<{ urls: string[] }> {
    const urls = await this.uploadService.getFileUrls(dto.paths);
    return { urls };
  }
}
