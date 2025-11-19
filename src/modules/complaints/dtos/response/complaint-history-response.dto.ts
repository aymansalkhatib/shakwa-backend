// File: src/modules/your-bucket-name/dtos/response/complaint-history-response.dto.ts

import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../../../common/enums/role.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

@Exclude()
export class ComplaintHistoryResponseDto {
  @Expose()
  id: number;

  @Expose()
  complaintId: number;

  @Expose()
  fromStatus: ComplaintStatus | null;

  @Expose()
  toStatus: ComplaintStatus | null;

  @Expose()
  note: string | null;

  @Expose()
  changedByRole: Role;

  @Expose()
  changedByCitizenId: number | null;

  @Expose()
  changedByInternalUserId: number | null;

  @Expose()
  createdAt: Date;
}
