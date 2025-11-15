import { FormatEnum } from 'sharp';
import { FileSizeUnit } from './file';

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
