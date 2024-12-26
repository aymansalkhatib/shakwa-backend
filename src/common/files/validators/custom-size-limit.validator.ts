import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { FileSizeUnit, SupportedFileType } from '../types/file.types';
import { processFilesBasedOnType } from '../utils/filter-type-file.utils';
import { checkFileSizeByType } from '../functions/file-checks/check-file-size-by-type';

export class CustomSizeLimitValidator extends FileValidator {
  constructor(
    private readonly options: {
      sizeLimits: Record<SupportedFileType, FileSizeUnit>;
    },
  ) {
    super({});
  }

  buildErrorMessage(file: any): string {
    return `The uploaded file exceeds the maximum allowed size for ${file.mimetype} files.`;
  }

  isValid(files: any): boolean {
    return processFilesBasedOnType<{
      sizeLimits: Record<SupportedFileType, FileSizeUnit>;
    }>(files, checkFileSizeByType, {
      sizeLimits: this.options.sizeLimits,
    });
  }
}
