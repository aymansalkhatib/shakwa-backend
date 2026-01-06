import { Type } from 'class-transformer';
import { IsInt, IsPositive, Max } from 'class-validator';

export class CleanupBackupsDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  keepCount: number;
}
