import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { UploadServiceExample } from './upload.service';
import { CustomFileParsingPipe } from 'src/common/files/pipes/parse-file.pipe';
import { ImageProcessingPipe } from 'src/common/files/pipes/image-processing.pipe';
import { join } from 'path';
import { promises as fs } from 'fs';

@Controller('upload')
export class UploadControllerExample {
  constructor(private readonly uploadService: UploadServiceExample) {}

  @Post('single-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadSingleImage(
    @UploadedFile(CustomFileParsingPipe, ImageProcessingPipe)
    file: Express.Multer.File,
  ) {
    const uploadDir = join(__dirname, '..', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

     const fileName =file.originalname;
    const filePath = join(uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return {
      message: 'Image uploaded and saved successfully',
      fileName,
      path: filePath,
      name: file.originalname,
    };
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
    @UploadedFiles(
      new CustomFileParsingPipe({ allowedFileTypes: ['png', 'ogg'] }),
      ImageProcessingPipe,
    )
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
    return this.uploadService.multipleFiles(files);
  }
}
