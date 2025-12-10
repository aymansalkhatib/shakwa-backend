import {
  FileSizeUnit,
  FileValidationOptions,
  ImageCompressionOptions,
  ImageFormat,
  NonEmptyArray,
  SupportedFileType,
} from '../types';

/**
 * Defines the maximum size limit for each supported file type.
 */
export const FILE_SIZE_LIMITS: Record<SupportedFileType, FileSizeUnit> = {
  png: '2MB',
  jpg: '2MB',
  jpeg: '2MB',
  pdf: '2MB',
  mp4: '20MB',
  ogg: '4MB',
  txt: '2MB',
  mp3: '2MB',
  docx: '4MB',
};

/**
 * Predefined allowed file types grouped by usage context.
 */
export const IMAGE_FILE_TYPES: NonEmptyArray<SupportedFileType> = ['png', 'jpg', 'jpeg'];
export const VIDEO_FILE_TYPES: NonEmptyArray<SupportedFileType> = ['mp4'];
export const AUDIO_FILE_TYPES: NonEmptyArray<SupportedFileType> = ['ogg'];
export const DOCUMENT_FILE_TYPES: NonEmptyArray<SupportedFileType> = ['txt'];

/**
 * Maps field names to allowed file types to enforce field-specific file restrictions.
 */

/**
 * List of supported file formats used by the Sharp image processing library.
 */
export const SHARP_SUPPORTED_FORMATS: string[] = [
  'avif',
  'dz',
  'fits',
  'gif',
  'heif',
  'input',
  'jpeg',
  'jpg',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'png',
  'ppm',
  'raw',
  'svg',
  'tiff',
  'tif',
  'v',
  'webp',
];

export const DEFAULT_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  quality: 80,
  minQuality: 50,
  maxFileSize: '150KB',
  outputFormat: 'jpeg',
};

export const FORMAT_PRIORITIES: ImageFormat[] = ['webp', 'jpeg', 'png'];

/**
 * Default values for FileValidationOptions.
 */
export const DEFAULT_FILE_VALIDATION_OPTIONS: FileValidationOptions = {
  isFileRequired: true, // By default, a file is required
  allowedFileTypes: IMAGE_FILE_TYPES, // Default allowed file types (images)
  globalMaxFileSize: '25MB', // Default max file size for all file types
  perTypeSizeLimits: FILE_SIZE_LIMITS, // specific limits by type by default
};
