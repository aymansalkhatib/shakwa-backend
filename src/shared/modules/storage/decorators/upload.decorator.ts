import { applyDecorators, UseInterceptors } from '@nestjs/common';
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

export function MultipleFilesUpload(
  fieldName: string = 'files',
  maxCount: number = 2,
) {
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

export function AnyFilesUpload(
  localOptions: MulterOptions = { limits: { files: 5 } },
) {
  return applyDecorators(UseInterceptors(AnyFilesInterceptor(localOptions)));
}
