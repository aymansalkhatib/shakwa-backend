import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import * as bytes from 'bytes';
import { FileSizeUnit } from '../types/file.types';
import { processFilesBasedOnType } from '../utils/filter-type-file.utils';

export class MaxFileSizeValidator extends FileValidator {
  private readonly maxSize: number;

  constructor(
    private readonly options: {
      maxSize: FileSizeUnit;
      message?: (maxSize: number) => string;
    },
  ) {
    super({});
    this.maxSize = bytes(this.options.maxSize.toString());
  }

  buildErrorMessage(): string {
    const defaultMessage = `File size exceeds limit. Max allowed size is ${this.maxSize} bytes.`;
    return this.options.message
      ? this.options.message(this.maxSize)
      : defaultMessage;
  }

  isValid(files: any): boolean {
    console.log('isValid file: ');

    function checkSize(file: Express.Multer.File, options: { maxSize: number }) {
      return file.size <= options.maxSize;
    }

    return processFilesBasedOnType<{ maxSize: number }>(files, checkSize, {
      maxSize: this.maxSize,
    });
  }
}
