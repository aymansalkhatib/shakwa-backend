import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import * as bytes from 'bytes';
import { FileSizeUnit, FileUpload } from '../types/file.types';
import { validateFileUpload } from '../utils/filter-type-file.utils';

/**
 * Validates the size of an uploaded file ensuring it does not exceed the specified size limit.
 */
export class MaxFileSizeValidator extends FileValidator {
  private readonly globalMaxFileSize: number;

  /**
   * Constructor for initializing the validator with the maximum file size and optional custom error message.
   * @param options - Configuration options including max size and optional custom message.
   */
  constructor(
    private readonly config: {
      globalMaxFileSize: FileSizeUnit;
      errorMessage?: (maxSize: number) => string;
    },
  ) {
    super({});
    // Convert the max size (provided as string) to bytes using the 'bytes' library
    this.globalMaxFileSize = bytes(this.config.globalMaxFileSize);
  }

  /**
   * Builds the error message if the file size exceeds the allowed limit.
   * @returns {string} The error message to be displayed.
   */
  buildErrorMessage(): string {
    // Default error message if no custom message is provided
    const defaultMessage = `The file size exceeds the allowed limit. Maximum allowed size is ${this.globalMaxFileSize} bytes.`;
    return this.config.errorMessage
      ? this.config.errorMessage(this.globalMaxFileSize)
      : defaultMessage;
  }

  /**
   * Validates the size of the uploaded file(s).
   * @param files - The files to validate.
   * @returns {boolean} True if all files are within the allowed size limit, false otherwise.
   */
  isValid(files: FileUpload): boolean {
    // Function to check if an individual file's size is within the allowed limit
    function isFileSizeWithinLimit(
      file: Express.Multer.File,
      config: { maxSize: number },
    ) {
      return file.size <= config.maxSize;
    }

    // Perform validation for all files using the utility function 'validateFileUpload'
    return validateFileUpload<{ maxSize: number }>(files, isFileSizeWithinLimit, {
      maxSize: this.globalMaxFileSize,
    });
  }
}
