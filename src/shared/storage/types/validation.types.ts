// src/common/types/validation.types.ts

import { FileSizeUnit, NonEmptyArray, SupportedFileType } from './file.types';

/**
 * Validation rules applied to uploaded files.
 */
export interface FileValidationOptions {
  /**
   * Indicates if the file must be uploaded. Defaults to false.
   */
  isFileRequired?: boolean;

  /**
   * List of allowed file types for this field. Must not be empty.
   */
  allowedFileTypes?: NonEmptyArray<SupportedFileType>;

  /**
   * Maximum allowed file size for this field, applied to all types unless overridden.
   */
  globalMaxFileSize?: FileSizeUnit;

  /**
   * Specific size limits per file type. Overrides globalMaxFileSize for matching types.
   */
  perTypeSizeLimits?: Record<SupportedFileType, FileSizeUnit>;
}
