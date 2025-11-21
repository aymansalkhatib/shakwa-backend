import {
  FileValidator,
  HttpStatus,
  Inject,
  Injectable,
  ParseFilePipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileValidationOptions } from '../types';
import { FileNameValidator } from '../validators/file-name-validator';
import { FileValidationSignatureValidator } from '../validators/file-signature.validator';
import { FileSizeValidatorPerType } from '../validators/file-size-validator-per-type';
import { MaxFileSizeValidator } from '../validators/max-file-size.validator';
import { NonEmptyFileValidator } from '../validators/non-empty-file-validator';
import { FILE_VALIDATION_CONFIG } from '../constants/storage.token';

/**
 * CustomFileParsingPipe provides comprehensive file validation for uploaded files
 * including size limits, type checking, and content validation.
 */

@Injectable()
export class CustomFileParsingPipe extends ParseFilePipe {
  constructor(
    @Inject(FILE_VALIDATION_CONFIG)
    readonly options: FileValidationOptions,
  ) {
    const { globalMaxFileSize, allowedFileTypes, isFileRequired, perTypeSizeLimits } = options;

    const validators: FileValidator[] = [
      // Validates the global maximum file size
      new MaxFileSizeValidator({ globalMaxFileSize }),

      // Validates type-specific size limits
      new FileSizeValidatorPerType({ perTypeSizeLimits, allowedFileTypes }),

      // Validates file type and signature
      new FileValidationSignatureValidator(allowedFileTypes, true),

      // Ensures file is not empty
      new NonEmptyFileValidator(),

      // Validates file name format
      new FileNameValidator(),
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

      exceptionFactory: (error: any) => {
        throw new UnprocessableEntityException(error);
      },
    });
  }
}
