// File: src/modules/your-bucket-name/dtos/response/complaint-response.dto.ts

import { Exclude, Expose } from 'class-transformer';
import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintCategory } from '../../enums/complaint-category.enum';
import { ComplaintPriority } from '../../enums/complaint-priority.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

@Exclude()
export class ComplaintResponseDto {
  @Expose()
  id: number;

  @Expose()
  referenceNumber: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: ComplaintStatus;

  @Expose()
  priority: ComplaintPriority;

  @Expose()
  category: ComplaintCategory;

  @Expose()
  authority: ComplaintAuthority;

  @Expose()
  locationText: string | null;

  @Expose()
  latitude: number | null;

  @Expose()
  longitude: number | null;

  @Expose()
  attachments: string[];

  @Expose()
  citizenId: number;

  @Expose()
  assignedToInternalUserId: number | null;

  @Expose()
  lockedByInternalUserId: number | null;

  @Expose()
  lockedAt: Date | null;

  @Expose()
  closedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
