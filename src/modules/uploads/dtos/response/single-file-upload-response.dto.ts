import { Expose, Type } from 'class-transformer';
import { FileInfoDto } from './file-info.dto';

export class SingleFileUploadResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileInfoDto)
  file: FileInfoDto;
}
