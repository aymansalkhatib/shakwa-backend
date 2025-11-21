import { Expose, Type } from 'class-transformer';

class FileInfoDto {
  @Expose()
  originalName: string;

  @Expose()
  filename: string;

  @Expose()
  path: string;

  @Expose()
  url: string;

  @Expose()
  size: number;

  @Expose()
  mimeType: string;

  @Expose()
  fieldName?: string;
}

export class SingleFileUploadResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileInfoDto)
  file: FileInfoDto;
}

export class MultipleFilesUploadResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileInfoDto)
  files: FileInfoDto[];

  @Expose()
  totalFiles: number;

  @Expose()
  totalSize: number;
}

export class AnyFilesUploadResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileInfoDto)
  files: FileInfoDto[];

  @Expose()
  filesByField: Record<string, FileInfoDto[]>;

  @Expose()
  totalFiles: number;

  @Expose()
  totalSize: number;
}

export class MultipleTypesUploadResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  filesByField: Record<string, FileInfoDto[]>;

  @Expose()
  totalFiles: number;

  @Expose()
  totalSize: number;

  @Expose()
  fieldCount: number;
}

export class DeleteFileResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  deletedPath: string;
}

export class DeleteMultipleFilesResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  deletedPaths: string[];

  @Expose()
  totalDeleted: number;
}
