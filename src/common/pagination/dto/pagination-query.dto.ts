import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 10;
}
