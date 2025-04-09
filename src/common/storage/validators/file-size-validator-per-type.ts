import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { FileSizeUnit, FileUpload, SupportedFileType } from '../types/file.types';
import * as bytes from 'bytes';
import {
  isArrayOfFiles,
  isSingleFile,
  validateFileUpload,
} from '../functions/file-structure-checker';
import { BadRequestException } from '@nestjs/common';
import { formatBytes } from '../functions/format-bytes';
import { extractFileExtension } from '../functions/file-helper.functions.ts';

/**
 * Validates file sizes based on their type.
 * Enforces different size limits for different file types.
 */
export class FileSizeValidatorPerType extends FileValidator {
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
    // Case: single or array of files
    if (isSingleFile(file) || isArrayOfFiles(file)) {
      try {
        const fileType = this.extractFileType(file);
        const maxSize = this.options.perTypeSizeLimits[fileType];

        return `File size validation failed: ${file.originalname} (${formatBytes(file.size)}) exceeds the maximum allowed size of ${maxSize} for ${fileType} files.`;
      } catch (error) {
        return `File "${file.originalname}" is invalid or unsupported.`;
      }
    }

    const sortedLimits = this.getAllLimitsSortedBySize(
      this.options.perTypeSizeLimits,
    );

    const limitsDescription = sortedLimits
      .map(([type, size]) => `[${type}: ${size}]`)
      .join(', ');

    return `Invalid file or unsupported type. Supported file size limits are: ${limitsDescription}`;
  }

  private getAllLimitsSortedBySize(
    limits: Record<SupportedFileType, FileSizeUnit>,
  ): [SupportedFileType, FileSizeUnit][] {
    const result: [SupportedFileType, FileSizeUnit][] = [];

    for (const [type, size] of Object.entries(limits)) {
      result.push([type as SupportedFileType, size as FileSizeUnit]);
    }

    return result.sort((a, b) => bytes(b[1]) - bytes(a[1]));
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
      throw new BadRequestException(
        `No size limit defined for file type: ${fileType}`,
      );
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
    const extension = extractFileExtension(file.originalname);
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
