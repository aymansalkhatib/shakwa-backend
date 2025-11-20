// File: src/modules/your-bucket-name/dtos/request/citizen/cancel-complaint.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelComplaintDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
