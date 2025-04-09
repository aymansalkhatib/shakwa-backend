import { FormatEnum } from 'sharp';

/**
 * All supported MIME file types within the system.
 */
export type SupportedFileType =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'pdf'
  | 'mp4'
  | 'ogg'
  | 'txt';

/**
 * Standard file size format. Example: '5MB', '100KB'.
 */
export type FileSizeUnit = `${number}${'KB' | 'MB' | 'GB' | 'TB'}`;

/**
 * Represents a non-empty array (at least one element is required).
 */
export type NonEmptyArray<T> = [T, ...T[]];

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
  perTypeSizeLimits?:Record<SupportedFileType, FileSizeUnit>;
}

/**
 * Supported output formats for image compression, as defined by Sharp.
 */
export type ImageFormat = keyof FormatEnum;

/**
 * Options for image compression and conversion.
 */
export interface ImageCompressionOptions {
  /**
   * Compression quality (0–100). Applies to lossy formats like JPEG/WebP.
   */
  quality?: number;

  /**
   * Minimum quality allowed for image compression (used in adaptive logic).
   */
  minQuality?: number;

  /**
   * Desired max size after compression (e.g., '500KB').
   */
  maxFileSize?: FileSizeUnit;

  /**
   * Desired output image format after compression (e.g., 'webp').
   */
  outputFormat?: ImageFormat;
}

/**
 * Image size (used for resizing or validation).
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Represents different types of file uploads that can be processed
 */
export type FileUpload =
  | Express.Multer.File
  | Express.Multer.File[]
  | Record<string, Express.Multer.File[]>;

/**
 * Structure for nested file uploads with multiple fields
 */
export interface NestedFileUpload {
  [key: string]: Express.Multer.File[];
}
