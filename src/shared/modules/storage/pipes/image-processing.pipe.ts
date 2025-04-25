import { Inject, Injectable, PipeTransform } from '@nestjs/common';
import { isArrayOfFiles, isSingleFile } from '../functions/file-structure-checker';
import { optimizeImage } from '../functions/optimize-image';
import { FileUpload, ImageCompressionOptions, NestedFileUpload } from '../types';
import { STORAGE_CONSTANTS } from '../constants/storage.constants';

@Injectable()
export class ImageProcessingPipe implements PipeTransform {
  constructor(
    @Inject(STORAGE_CONSTANTS.IMAGE_COMPRESSION_CONFIG)
    private readonly options: ImageCompressionOptions,
  ) {}

  /**
   * Transforms uploaded files by optimizing their size and quality
   * Handles single files, arrays of files, and nested file structures
   *
   * @param files - The uploaded file(s) to process
   * @returns The processed file(s) with optimized images
   */
  async transform(files: FileUpload) {
    if (!files) {
      return files;
    }

    return await this.processFiles(files);
  }

  /**
   * Routes the file processing based on the upload structure
   */
  private async processFiles(files: FileUpload): Promise<FileUpload> {
    if (isSingleFile(files)) {
      return this.processSingleFile(files as Express.Multer.File);
    }
    if (isArrayOfFiles(files)) {
      return this.processFileArray(files as Express.Multer.File[]);
    }
    return this.processNestedFiles(files as Record<string, Express.Multer.File[]>);
  }

  /**
   * Processes a single file upload
   */

  private async processSingleFile(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    return optimizeImage(file, this.options);
  }

  /**
   * Processes an array of file uploads concurrently
   */
  private async processFileArray(
    files: Express.Multer.File[],
  ): Promise<Express.Multer.File[]> {
    return Promise.all(files.map((file) => this.processSingleFile(file)));
  }

  private async processNestedFiles(
    files: NestedFileUpload,
  ): Promise<NestedFileUpload> {
    const processedFiles: NestedFileUpload = { ...files };

    await Promise.all(
      Object.entries(processedFiles).map(async ([key, fileArray]) => {
        if (Array.isArray(fileArray)) {
          processedFiles[key] = await this.processFileArray(fileArray);
        }
      }),
    );

    return processedFiles;
  }
}
