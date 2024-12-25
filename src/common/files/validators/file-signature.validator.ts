import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { filterTypeFile } from '../utils/filter-type-file.utils';
import { NonEmptyArray, SupportedFileType } from '../types/file.types';
import { fieldType } from '../constants/file.constants';
import { checkMimeType } from '../functions/file-checks/check-mime-type';
import { checkMagicNumber } from '../functions/file-checks/check-magic-number';
import { checkIsFileTypeAllowedForField } from '../functions/file-checks/check-is-file-type-allowed-for-field';

export class FileSignatureValidator extends FileValidator {
  protected validationOptions: Record<string, any>;
  private message: string = 'Error';

  constructor(
    private readonly allowedMimeTypes: NonEmptyArray<SupportedFileType>,
    private readonly strictCheck: boolean = true,
    private readonly mimeTypeError: string = 'Invalid file type provided. Allowed types are: ' +
      allowedMimeTypes.join(', '),
    private readonly magicNumberError: string = 'File signature does not match the expected format.',
    private readonly fieldTypeError: string = 'File type not allowed for the specified field.',
  ) {
    super({});
  }

  buildErrorMessage(): string {
    return this.message;
  }

  isValid(files: any): boolean {
    if (
      !filterTypeFile<NonEmptyArray<SupportedFileType>>(
        files,
        checkMimeType,
        this.allowedMimeTypes,
      )
    ) {
      this.message = this.mimeTypeError;
      return false;
    }

    if (this.strictCheck) {
      if (!filterTypeFile(files, checkMagicNumber)) {
        this.message = this.magicNumberError;
        return false;
      }
    }

    if (
      !filterTypeFile<Record<string, NonEmptyArray<SupportedFileType>>>(
        files,
        checkIsFileTypeAllowedForField,
        fieldType,
      )
    ) {
      this.message = this.fieldTypeError;
      return false;
    }

    return true;
  }
}
