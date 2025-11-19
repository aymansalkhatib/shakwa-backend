// File: src/modules/your-bucket-name/dtos/request/update-complaint-status.dto.ts

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus, { message: 'Status must be a valid ComplaintStatus' })
  status: ComplaintStatus;

  @IsOptional()
  @IsString({ message: 'Note must be a string' })
  @MaxLength(2000, { message: 'Note must not exceed 2000 characters' })
  note?: string;
}
