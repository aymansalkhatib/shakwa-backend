// File: src/modules/your-bucket-name/dtos/request/admin/reassign-complaint.dto.ts

import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * Admin can reassign a complaint to a specific internal user.
 * If internalUserId is omitted, the complaint will be unassigned.
 */
export class ReassignComplaintDto {
  @IsOptional()
  @IsInt({ message: 'Internal user id must be an integer' })
  @Min(1, { message: 'Internal user id must be at least 1' })
  internalUserId?: number;
}
