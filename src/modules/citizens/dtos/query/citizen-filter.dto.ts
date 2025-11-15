import { IsOptional, IsString, MaxLength } from 'class-validator';
import { StrictBoolean } from '../../../../common/decorators/strict-boolean.decorator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';

export class CitizenFilterDto extends PaginationQueryDto {
  @IsString({ message: 'Search must be a string' })
  @IsOptional()
  search?: string;

  @IsOptional()
  @MaxLength(120, { message: 'Email must not exceed 120 characters' })
  email?: string;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @IsString({ message: 'Full name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName?: string;

  @IsOptional()
  @StrictBoolean()
  blocked?: boolean;
}
