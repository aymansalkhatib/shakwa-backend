import { Expose } from 'class-transformer';

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
