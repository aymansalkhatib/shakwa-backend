import { Expose } from 'class-transformer';

export class FileInfoDto {
  @Expose()
  url: string;

  @Expose()
  size: number;

  @Expose()
  mimeType: string;

  @Expose()
  fieldName: string;
}
