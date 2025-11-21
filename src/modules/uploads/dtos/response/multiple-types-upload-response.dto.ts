import { Expose } from 'class-transformer';
import { FileInfoDto } from './file-info.dto';

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
