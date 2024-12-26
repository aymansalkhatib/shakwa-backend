import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { processFilesBasedOnType } from '../utils/filter-type-file.utils';
import { checkFileIsNotEmpty } from '../functions/file-checks/check-file-is-not-empty';

export class FileNotEmptyValidator extends FileValidator {
  constructor() {
    super({});
  }

  buildErrorMessage(): string {
    return 'The uploaded file should not be empty.';
  }

  isValid(files: any): boolean {
    return processFilesBasedOnType(files, checkFileIsNotEmpty);
  }
}
