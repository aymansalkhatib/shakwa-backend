import {
  FileValidator,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileValidationOptions } from '../types';
import { FileNameValidator } from '../validators/file-name-validator';
import { FileValidationSignatureValidator } from '../validators/file-signature.validator';
import { FileSizeValidatorPerType } from '../validators/file-size-validator-per-type';
import { MaxFileSizeValidator } from '../validators/max-file-size.validator';
import { NonEmptyFileValidator } from '../validators/non-empty-file-validator';

@Injectable()
export class GroupedFileValidationPipe implements PipeTransform {
  constructor(private readonly schema: Record<string, FileValidationOptions>) {}

  async transform(value: Record<string, Express.Multer.File[]>) {
    if (!value) {
      return value;
    }

    for (const [fieldName, files] of Object.entries(value)) {
      const options = this.schema[fieldName];

      // If no validation options for this field, skip
      if (!options) {
        continue;
      }

      if (options.isFileRequired && (!files || files.length === 0)) {
        throw new UnprocessableEntityException(`File is required for field ${fieldName}`);
      }

      if (!files || files.length === 0) {
        continue;
      }

      const validators = this.createValidators(options);

      for (const file of files) {
        for (const validator of validators) {
          const isValid = validator.isValid(file);
          if (!isValid) {
            const errorMessage = validator.buildErrorMessage(file);
            throw new UnprocessableEntityException(`Field ${fieldName}: ${errorMessage}`);
          }
        }
      }
    }

    return value;
  }

  private createValidators(options: FileValidationOptions): FileValidator[] {
    const { globalMaxFileSize, allowedFileTypes, perTypeSizeLimits } = options;

    const validators: FileValidator[] = [
      // Validates the global maximum file size
      new MaxFileSizeValidator({ globalMaxFileSize }),

      // Validates file type and signature
      new FileValidationSignatureValidator(allowedFileTypes, true),

      // Ensures file is not empty
      new NonEmptyFileValidator(),

      // Validates file name format
      new FileNameValidator(),

      // Validates type-specific size limits
      new FileSizeValidatorPerType({ perTypeSizeLimits, allowedFileTypes }),
    ];

    return validators;
  }
}
