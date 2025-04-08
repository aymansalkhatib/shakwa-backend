import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { FileSizeUnit, FileUpload, SupportedFileType } from '../types/file.types';
import * as bytes from 'bytes';
import { validateFileUpload } from '../utils/filter-type-file.utils';
import { extractFileFormat } from '../functions/extract_file_format';

/**
 * Validates file sizes based on their type.
 * Enforces different size limits for different file types.
 */
export class FileSizeValidator extends FileValidator {
  constructor(
    private readonly options: {
      perTypeSizeLimits: Record<SupportedFileType, FileSizeUnit>;
    },
  ) {
    super({});
  }

  /**
   * Generates an error message when file size validation fails.
   * @param file - The file that failed validation
   * @returns Descriptive error message
   */
  buildErrorMessage(file: Express.Multer.File): string {
    const fileType = this.extractFileType(file);
    const maxSize = this.options.perTypeSizeLimits[fileType];
    return `File size validation failed: ${file.originalname} (${file.size} bytes) exceeds the maximum allowed size of ${maxSize} for ${fileType} files.`;
  }

  /**
   * Entry point for file size validation.
   * Handles different file upload patterns (single, array, multiple).
   * @param files - The file(s) to validate
   * @returns True if all files meet size requirements
   */
  isValid(files: FileUpload): boolean {
    return validateFileUpload<ValidationOptions>(
      files,
      this.validateFileSize.bind(this),
      this.options,
    );
  }

  /**
   * Validates a single file's size against its type-specific limit.
   * @param file - The file to validate
   * @param options - Size limits configuration
   * @returns True if file size is within limits
   * @private
   */
  private validateFileSize(
    file: Express.Multer.File,
    options: ValidationOptions,
  ): boolean {
    const fileType = this.extractFileType(file);
    const sizeLimit = options.perTypeSizeLimits[fileType];

    if (!sizeLimit) {
      return true; // No size limit specified for this file type
    }

    const maxSizeInBytes = bytes(sizeLimit);
    return file.size <= maxSizeInBytes;
  }

  /**
   * Extracts the file type from the file's original name.
   * @param file - The file to process
   * @returns The lowercase file extension
   * @private
   */
  private extractFileType(file: Express.Multer.File): SupportedFileType {
    const extension = extractFileFormat(file.originalname);
    if (!extension) {
      throw new Error(
        `Could not determine file type for file: ${file.originalname}`,
      );
    }
    return extension as SupportedFileType;
  }
}

/**
 * Type definition for the validation options used in the validator.
 */
interface ValidationOptions {
  perTypeSizeLimits: Record<SupportedFileType, FileSizeUnit>;
}
