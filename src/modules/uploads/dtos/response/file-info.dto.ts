import { Expose } from 'class-transformer';

export class FileInfoDto {
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
