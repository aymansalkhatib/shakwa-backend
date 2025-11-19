// File: src/modules/your-bucket-name/dtos/query/staff-complaint-filter.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';
import { StrictBoolean } from '../../../../common/decorators/strict-boolean.decorator';
import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintPriority } from '../../enums/complaint-priority.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

export class StaffComplaintFilterDto extends PaginationQueryDto {
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
  @StrictBoolean()
  includeUnassigned?: boolean;
}
