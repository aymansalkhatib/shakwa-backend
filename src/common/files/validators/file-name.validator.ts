import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { processFilesBasedOnType } from '../utils/filter-type-file.utils';
import { checkIsValidNameFile } from '../functions/file-checks/check-is-valid-name-file';

export class FileNameValidator extends FileValidator {
  constructor() {
    super({});
  }

  buildErrorMessage(): string {
    return 'The uploaded file name is invalid.';
  }

  isValid(files: any): boolean {
    return processFilesBasedOnType(files, checkIsValidNameFile);
  }
}
