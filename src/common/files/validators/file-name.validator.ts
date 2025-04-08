import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { validateFileUpload } from '../utils/filter-type-file.utils';
import { FileUpload } from '../types/file.types';

/**
 * Validates the file name during the upload process.
 * Ensures that the file name adheres to a specific format (e.g., contains only allowed characters).
 */
export class FileUploadNameValidator extends FileValidator {
  constructor() {
    // Calling the parent class constructor with an empty object as options.
    super({});
  }

  /**
   * Builds the error message when file name validation fails.
   * @returns {string} The error message indicating the file name is invalid.
   */
  buildErrorMessage(): string {
    return 'The uploaded file name is invalid. It must adhere to allowed naming conventions.';
  }

  /**
   * Main validation method that checks the file name's validity.
   * Supports single or multiple files based on the provided `files` parameter.
   * @param files - The uploaded file(s) to validate.
   * @returns {boolean} True if all files have valid names, false otherwise.
   */
  isValid(files: FileUpload): boolean {
    return validateFileUpload(files, this.isFileNameValid.bind(this));
  }

  /**
   * Validates if a single file's name matches the allowed format.
   * The allowed characters include Arabic characters, English letters, digits, and some special characters.
   * @param file - The file whose name is being validated.
   * @returns {boolean} True if the file name matches the allowed format, false otherwise.
   * @private
   */
  private isFileNameValid(file: Express.Multer.File): boolean {
    const allowedNamePattern = /^[\u0600-\u06FFa-zA-Z0-9_.\-()!@#\$%\^&+= ]+$/;
    return allowedNamePattern.test(file.originalname);
  }
}
