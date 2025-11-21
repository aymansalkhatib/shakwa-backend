import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  SingleFileUpload,
  MultipleFilesUpload,
  AnyFilesUpload,
  MultipleFieldFilesUpload,
  ProcessedFiles,
} from '@app/shared/services/storage';
import { SerializeResponse } from '@app/common/decorators/serialize-response.decorator';
import {
  SingleFileUploadResponseDto,
  MultipleFilesUploadResponseDto,
  AnyFilesUploadResponseDto,
  MultipleTypesUploadResponseDto,
  DeleteFileResponseDto,
  DeleteMultipleFilesResponseDto,
} from './dto/upload-response.dto';
import { DeleteFileDto, DeleteMultipleFilesDto } from './dto/delete-file.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @HttpCode(HttpStatus.CREATED)
  @SingleFileUpload('file')
  @SerializeResponse(SingleFileUploadResponseDto)
  async uploadSingle(
    @ProcessedFiles()
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
  @HttpCode(HttpStatus.OK)
  @SerializeResponse(DeleteFileResponseDto)
  async deleteFile(@Query() dto: DeleteFileDto): Promise<DeleteFileResponseDto> {
    return this.uploadService.deleteFile(dto.path);
  }

  @Delete('multiple')
  @HttpCode(HttpStatus.OK)
  @SerializeResponse(DeleteMultipleFilesResponseDto)
  async deleteMultiple(
    @Body() dto: DeleteMultipleFilesDto,
  ): Promise<DeleteMultipleFilesResponseDto> {
    return this.uploadService.deleteMultipleFiles(dto.paths);
  }

  @Get('url')
  @HttpCode(HttpStatus.OK)
  async getFileUrl(@Query('path') path: string): Promise<{ url: string }> {
    const url = await this.uploadService.getFileUrl(path);
    return { url };
  }
}
