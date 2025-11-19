// File: src/modules/your-bucket-name/dtos/query/admin-complaint-filter.dto.ts

import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';
import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintPriority } from '../../enums/complaint-priority.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

export class AdminComplaintFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid ComplaintStatus' })
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintAuthority, { message: 'Authority must be a valid ComplaintAuthority' })
  authority?: ComplaintAuthority;

  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid ComplaintPriority' })
  priority?: ComplaintPriority;

  @IsOptional()
  @IsInt({ message: 'Citizen id must be an integer' })
  @Min(1, { message: 'Citizen id must be at least 1' })
  citizenId?: number;

  @IsOptional()
  @IsInt({ message: 'Internal user id must be an integer' })
  @Min(1, { message: 'Internal user id must be at least 1' })
  assignedToInternalUserId?: number;
}
