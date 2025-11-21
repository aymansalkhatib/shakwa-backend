import { SerializeResponse } from '@app/common/decorators/serialize-response.decorator';
import {
  AnyFilesUpload,
  MultipleFieldFilesUpload,
  MultipleFilesUpload,
  ProcessedFile,
  ProcessedFiles,
  SingleFileUpload,
} from '@app/shared/services/storage';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  AnyFilesUploadResponseDto,
  DeleteFileDto,
  DeleteMultipleFilesDto,
  MultipleFilesUploadResponseDto,
  MultipleTypesUploadResponseDto,
  SingleFileUploadResponseDto,
} from './dtos';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUpload('file')
  @SerializeResponse(SingleFileUploadResponseDto)
  async uploadSingle(
    @ProcessedFile()
    file: Express.Multer.File,
  ): Promise<SingleFileUploadResponseDto> {
    return this.uploadService.uploadSingleFile(file);
  }

  @Post('multiple')
  @HttpCode(HttpStatus.CREATED)
  @MultipleFilesUpload('files', 10)
  @SerializeResponse(MultipleFilesUploadResponseDto)
  async uploadMultiple(
    @ProcessedFiles()
    files: Express.Multer.File[],
  ): Promise<MultipleFilesUploadResponseDto> {
    return this.uploadService.uploadMultipleFiles(files);
  }

  @Post('any')
  @HttpCode(HttpStatus.CREATED)
  @AnyFilesUpload({ limits: { files: 20 } })
  @SerializeResponse(AnyFilesUploadResponseDto)
  async uploadAny(
    @ProcessedFiles()
    files: Express.Multer.File[],
  ): Promise<AnyFilesUploadResponseDto> {
    return this.uploadService.uploadAnyFiles(files);
  }

  @Post('grouped')
  @HttpCode(HttpStatus.CREATED)
  @MultipleFieldFilesUpload([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 3 },
    { name: 'videos', maxCount: 2 },
  ])
  @SerializeResponse(MultipleTypesUploadResponseDto)
  async uploadGrouped(
    @ProcessedFiles()
    files: Record<string, Express.Multer.File[]>,
  ): Promise<MultipleTypesUploadResponseDto> {
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
  @HttpCode(HttpStatus.OK)
  async getFileUrl(@Query('path') path: string): Promise<{ url: string }> {
    const url = await this.uploadService.getFileUrl(path);
    return { url };
  }
}
