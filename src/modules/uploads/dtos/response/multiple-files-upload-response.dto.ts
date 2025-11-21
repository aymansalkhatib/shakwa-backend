import { Expose, Type } from 'class-transformer';
import { FileInfoDto } from './file-info.dto';

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
