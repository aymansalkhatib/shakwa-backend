import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import magicBytes from 'magic-bytes.js';
import { extractFileExtension } from '../functions/file-helper';
import { validateFileUpload } from '../functions/file-structure-checker';
import { FileUpload, NonEmptyArray, SupportedFileType } from '../types/file';

/**
 * Validates files' signatures including MIME type, magic number, and field-specific constraints.
 * This class is responsible for performing several validation checks to ensure file integrity and type validity.
 */
export class FileValidationSignatureValidator extends FileValidator {
  private currentErrorMessage: string = '';

  constructor(
    private readonly allowedFileTypes: NonEmptyArray<SupportedFileType>,
    private readonly enableStrictValidation: boolean = true,
    private readonly errorMessages: {
      mimeType?: string;
      magicNumber?: string;
      fieldType?: string;
    } = {
      mimeType: 'Invalid file type provided. Allowed types are: ' + allowedFileTypes.join(', '),
      magicNumber: 'File signature does not match the expected format.',
      fieldType: 'File type not allowed for the specified field.',
    },
  ) {
    super({});
  }

  /**
   * Fetches the current error message from the most recent validation failure.
   * @returns {string} The error message associated with the last validation failure.
   */
  buildErrorMessage(): string {
    return this.currentErrorMessage;
  }

  /**
   * Validates files based on MIME type, magic number (optional), and field-specific constraints.
   * @param {any} files - The file(s) to validate.
   * @returns {boolean} True if all validations pass.
   */
  isValid(files: FileUpload): boolean {
    if (!this.validateMimeTypeOfFiles(files)) {
      return false;
    }

    if (this.enableStrictValidation && !this.validateMagicNumberOfFiles(files)) {
      return false;
    }

    return true;
  }

  /**
   * Validates the MIME type of the provided files.
   * @param {any} files - The file(s) to validate.
   * @returns {boolean} True if all files have valid MIME types.
   * @private
   */
  private validateMimeTypeOfFiles(files: any): boolean {
    const isValid = validateFileUpload<NonEmptyArray<SupportedFileType>>(
      files,
      this.isMimeTypeValidForFile,
      this.allowedFileTypes,
    );

    if (!isValid) {
      this.currentErrorMessage = this.errorMessages.mimeType;
    }

    return isValid;
  }

  /**
   * Validates the magic number of the files to ensure content type validity.
   * @param {any} files - The file(s) to validate.
   * @returns {boolean} True if all files have valid magic numbers.
   * @private
   */
  private validateMagicNumberOfFiles(files: any): boolean {
    const isValid = validateFileUpload(files, this.isMagicNumberValidForFile);

    if (!isValid) {
      this.currentErrorMessage = this.errorMessages.magicNumber;
    }

    return isValid;
  }

  /**
   * Checks if the MIME type of the file is valid according to the allowed types.
   * @param {Express.Multer.File} file - The file to check.
   * @param {NonEmptyArray<SupportedFileType>} allowedMimeTypes - Allowed MIME types.
   * @returns {boolean} True if the file's MIME type is valid.
   * @private
   */
  private isMimeTypeValidForFile(
    file: Express.Multer.File,
    allowedMimeTypes: NonEmptyArray<SupportedFileType>,
  ): boolean {
    const fileExt: string = extractFileExtension(file.originalname);

    return (allowedMimeTypes as string[]).includes(fileExt);
  }

  /**
   * Checks if the file's magic number (file signature) is valid.
   * @param {Express.Multer.File} file - The file to check.
   * @returns {boolean} True if the file's magic number matches the expected signature.
   * @private
   */
  private isMagicNumberValidForFile(file: Express.Multer.File): boolean {
    const detectedSignatures = magicBytes(file.buffer).map((detectedFile) => detectedFile.mime);

    if (!detectedSignatures.length) return false;

    const detectedSubtypes = detectedSignatures.map((signature) => signature.split('/')[1]);

    const fileSubtype = file.mimetype.split('/')[1];

    return detectedSubtypes.includes(fileSubtype);
  }
}
