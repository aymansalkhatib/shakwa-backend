// File: src/modules/your-bucket-name/repositories/complaint-history.repository.interface.ts

import { Role } from '../../../common/enums/role.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';

/**
 * Data needed to create a complaint history entry.
 */
export interface ICreateComplaintHistoryData {
  complaintId: number;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus | null;
  note: string | null;
  changedByRole: Role;
  changedByCitizenId: number | null;
  changedByInternalUserId: number | null;
}

export interface IComplaintHistoryRepository {
  addEntry(data: ICreateComplaintHistoryData): Promise<ComplaintHistoryEntity>;
  findByComplaintId(complaintId: number): Promise<ComplaintHistoryEntity[]>;
}
