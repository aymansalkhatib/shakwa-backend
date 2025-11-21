import { Expose } from 'class-transformer';

export class DeleteFileResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  deletedPath: string;
}
