import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class BackupFileNameDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\w-]+\.sql\.gz$/, {
    message:
      'fileName must be a valid backup file name (e.g., dbname_2024-01-01T00-00-00-000Z.sql.gz)',
  })
  fileName: string;
}
