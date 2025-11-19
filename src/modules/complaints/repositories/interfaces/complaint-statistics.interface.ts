// File: src/modules/your-bucket-name/repositories/interfaces/complaint-statistics.interface.ts

import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

/**
 * Aggregated statistics used for admin dashboards.
 */
export interface IComplaintStatistics {
  totalComplaints: number;
  your-bucket-nameByStatus: Record<ComplaintStatus, number>;
  your-bucket-nameByAuthority: Record<ComplaintAuthority, number>;
}
