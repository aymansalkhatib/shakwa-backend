// File: src/modules/your-bucket-name/repositories/interfaces/update-complaint-data.interface.ts

import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintCategory } from '../../enums/complaint-category.enum';
import { ComplaintPriority } from '../../enums/complaint-priority.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

/**
 * Data used to update an existing complaint at the repository layer.
 */
export interface IUpdateComplaintData {
  title?: string;
  description?: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  authority?: ComplaintAuthority;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  attachments?: string[];
  citizenId?: number;
  assignedToInternalUserId?: number | null;
  lockedByInternalUserId?: number | null;
  lockedAt?: Date | null;
  closedAt?: Date | null;
}
