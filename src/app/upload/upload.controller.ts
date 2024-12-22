import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { CustomFileParsingPipe } from 'src/common/files/pipes/parse-file.pipe';
import { ImageProcessingPipe } from 'src/common/files/pipes/image-processing.pipe';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadSingleImage(
    @UploadedFile(CustomFileParsingPipe, ImageProcessingPipe)
    file: Express.Multer.File,
  ) {
    console.log(file.buffer.length);

    return this.uploadService.uploadSingleImage(file);
  }

  @Post('array-images')
  @UseInterceptors(FilesInterceptor('images', 8))
  uploadMultipleImages(
    @UploadedFiles(CustomFileParsingPipe)
    files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadMultipleImages(files);
  }

  @Post('any-files')
  @UseInterceptors(AnyFilesInterceptor())
  uploadAnyFiles(
    @UploadedFiles(new CustomFileParsingPipe({supportedFileTypes:['png','ogg']}), ImageProcessingPipe)
    files: Express.Multer.File[],
  ) {
    return this.uploadService.uploadAnyFiles(files);
  }

  @Post('multiple-files')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 10 },
      { name: 'avatar', maxCount: 1 },
      { name: 'document', maxCount: 1 },
      { name: 'videos', maxCount: 5 },
      { name: 'audio', maxCount: 3 },
    ]),
  )
  multiFiles(
    @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
    files: Record<string, Express.Multer.File[]>,
  ) {
    console.log(files.images);

    return this.uploadService.multipleFiles(files);
  }
}
