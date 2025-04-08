import {
  FileValidator,
  HttpStatus,
  ParseFilePipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileValidationOptions } from '../types/file.types';
import { NonEmptyFileValidator } from '../validators/file-not-empty.validator';
import { FileSizeValidator as FileTypeSizeValidator } from '../validators/custom-size-limit.validator';
import { DEFAULT_FILE_VALIDATION_OPTIONS } from '../constants/file.constants';
import { MaxFileSizeValidator } from '../validators/max-file-size.validator';
import { FileUploadNameValidator } from '../validators/file-name.validator';
import { FileValidationSignatureValidator } from '../validators/file-signature.validator';

/**
 * CustomFileParsingPipe provides comprehensive file validation for uploaded files
 * including size limits, type checking, and content validation.
 */
export class CustomFileParsingPipe extends ParseFilePipe {
  constructor(options: FileValidationOptions = DEFAULT_FILE_VALIDATION_OPTIONS) {
    const {
      globalMaxFileSize,
      allowedFileTypes,
      isFileRequired,
      perTypeSizeLimits,
    } = options;

    const validators: FileValidator[] = [
      // Validates the global maximum file size
      new MaxFileSizeValidator({ globalMaxFileSize }),

      // Validates file type and signature
      new FileValidationSignatureValidator(allowedFileTypes, true),

      // Ensures file is not empty
      new NonEmptyFileValidator(),

      // Validates file name format
      new FileUploadNameValidator(),

      // Validates type-specific size limits
      new FileTypeSizeValidator({ perTypeSizeLimits }),
    ];

    /**
     * Creates the exception factory function for validation errors
     *
     * @returns Function that creates UnprocessableEntityException
     */
    super({
      validators,
      errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      fileIsRequired: isFileRequired,
      exceptionFactory: (error: string) => {
        throw new UnprocessableEntityException(error);
      },
    });
  }
}
