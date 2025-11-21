import { applyDecorators, UseInterceptors, UploadedFiles } from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  MulterField,
  MulterOptions,
} from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { CustomFileParsingPipe } from '../pipes/parse-file.pipe';
import { ImageProcessingPipe } from '../pipes/image-processing.pipe';

export function SingleFileUpload(fieldName: string = 'file') {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        limits: {
          files: 1,
        },
      }),
    ),
  );
}

export function MultipleFilesUpload(fieldName: string = 'files', maxCount: number = 2) {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, maxCount, {
        limits: {
          files: maxCount,
        },
      }),
    ),
  );
}

export function MultipleFieldFilesUpload(fields: MulterField[]) {
  if (!fields?.length) {
    throw new Error('Fields array is required for fields upload');
  }
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(fields, {
        limits: {},
      }),
    ),
  );
}

export function AnyFilesUpload(localOptions: MulterOptions = { limits: { files: 5 } }) {
  return applyDecorators(UseInterceptors(AnyFilesInterceptor(localOptions)));
}

/**
 * Parameter decorator that combines @UploadedFiles with CustomFileParsingPipe and ImageProcessingPipe.
 * This simplifies the common pattern of applying both pipes to uploaded files.
 *
 * @example
 * // Instead of:
 * // @UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe)
 * // Use:
 * // @ProcessedFiles()
 *
 * @returns A parameter decorator that applies file parsing and image processing
 */
export const ProcessedFiles = () => UploadedFiles(CustomFileParsingPipe, ImageProcessingPipe);
