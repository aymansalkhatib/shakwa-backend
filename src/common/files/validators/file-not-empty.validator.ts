import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { validateFileUpload } from '../functions/file-structure-checker';
import { FileUpload } from '../types/file.types';

/**
 * Validates that uploaded files are not empty (size > 0)
 * Can handle single files, arrays of files, and multiple file groups
 */
export class NonEmptyFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  /**
   * Provides a descriptive error message when validation fails
   * @returns {string} Error message for empty file validation failure
   */
  buildErrorMessage(): string {
    return 'File validation failed: The uploaded file cannot be empty';
  }

  /**
   * Verifies that a single file has content (size > 0)
   * @param {Express.Multer.File} file - The file to validate
   * @returns {boolean} True if file has content, false if empty
   */
  private validateFileContent(file: Express.Multer.File): boolean {
    return file.size > 0;
  }

  /**
   * Entry point for file validation
   * Handles different file upload patterns (single, array, multiple)
   * @param {any} files - The file(s) to validate
   * @returns {boolean} True if all files are valid, false otherwise
   */
  isValid(files: FileUpload): boolean {
    return validateFileUpload(files, this.validateFileContent);
  }
}
