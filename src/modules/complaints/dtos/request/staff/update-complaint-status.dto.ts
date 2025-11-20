// File: src/modules/your-bucket-name/dtos/request/staff/update-complaint-status.dto.ts

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintStatus } from '../../../your-bucket-name/enums';

/**
 * تحديث الحالة (للـ staff أو admin).
 */
export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
