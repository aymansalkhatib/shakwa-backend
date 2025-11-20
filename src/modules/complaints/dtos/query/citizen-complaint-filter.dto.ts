import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintAuthority, ComplaintCategory, ComplaintStatus } from '../..';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';

export class CitizenComplaintFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid ComplaintStatus' })
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintCategory, { message: 'Category must be a valid ComplaintCategory' })
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintAuthority, { message: 'Authority must be a valid ComplaintAuthority' })
  authority?: ComplaintAuthority;
}
