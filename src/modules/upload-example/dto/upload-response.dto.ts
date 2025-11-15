import { Exclude, Expose, Type } from 'class-transformer';

/**
 * File information DTO containing metadata about an uploaded file
 */
@Exclude()
export class FileInfoDto {
  /**
   * The original filename
   */
  @Expose()
  originalName: string;

  /**
   * The storage path where the file was saved
   */
  @Expose()
  storagePath?: string;

  /**
   * The file size in bytes
   */
  @Expose()
  size: number;

  /**
   * The MIME type of the file
   */
  @Expose()
  mimetype: string;

  /**
   * Field name used in the upload
   */
  @Expose()
  fieldname: string;

  /**
   * Upload timestamp
   */
  @Expose()
  uploadedAt: Date;

  /**
   * File encoding (if available)
   */
  @Expose()
  encoding?: string;
}

/**
 * Response DTO for single file upload
 */
@Exclude()
export class SingleFileUploadResponseDto {
  /**
   * Uploaded file information
   */
  @Expose()
  @Type(() => FileInfoDto)
  file: FileInfoDto;

  /**
   * Upload success message
   */
  @Expose()
  message: string;
}

/**
 * Response DTO for multiple files upload
 */
@Exclude()
export class MultipleFilesUploadResponseDto {
  /**
   * Array of uploaded file information
   */
  @Expose()
  @Type(() => FileInfoDto)
  files: FileInfoDto[];

  /**
   * Total number of files uploaded
   */
  @Expose()
  totalFiles: number;

  /**
   * Total size of all uploaded files in bytes
   */
  @Expose()
  totalSize: number;

  /**
   * Upload success message
   */
  @Expose()
  message: string;
}

/**
 * Response DTO for any files upload (grouped by field name)
 */
@Exclude()
export class AnyFilesUploadResponseDto {
  /**
   * Files grouped by their field name
   */
  @Expose()
  filesByField: Record<string, FileInfoDto[]>;

  /**
   * Total number of files uploaded
   */
  @Expose()
  totalFiles: number;

  /**
   * Total size of all files in bytes
   */
  @Expose()
  totalSize: number;

  /**
   * Upload success message
   */
  @Expose()
  message: string;
}

/**
 * Response DTO for multiple types of files upload
 */
@Exclude()
export class MultipleTypesUploadResponseDto {
  /**
   * Files organized by field name
   */
  @Expose()
  filesByField: Record<string, FileInfoDto[]>;

  /**
   * Total number of files uploaded
   */
  @Expose()
  totalFiles: number;

  /**
   * Total size of all files in bytes
   */
  @Expose()
  totalSize: number;

  /**
   * Number of different field types
   */
  @Expose()
  fieldCount: number;

  /**
   * Upload success message
   */
  @Expose()
  message: string;
}

