import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';
import { ComplaintAuthority, ComplaintCategory, ComplaintStatus } from '../../enums';

export class AdminComplaintFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintAuthority)
  authority?: ComplaintAuthority;

  @IsOptional()
  @IsInt()
  @Min(1)
  citizenId?: number;
}
