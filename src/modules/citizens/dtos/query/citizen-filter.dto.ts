import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';

export class CitizenFilterDto extends PaginationQueryDto {
  @IsString({ message: 'Search must be a string' })
  @IsOptional()
  search?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
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

  @Type(() => Boolean)
  @IsBoolean({ message: 'Blocked must be a boolean' })
  @IsOptional()
  blocked?: boolean;
}
