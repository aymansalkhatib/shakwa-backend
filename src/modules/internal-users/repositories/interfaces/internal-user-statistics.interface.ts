import { InternalRole } from '../../../../common/enums/role.enum';
import { ComplaintAuthority } from '../../../your-bucket-name';

/**
 * Interface for internal user statistics
 * Used by repository layer for aggregated data
 */
export interface IInternalUserStatistics {
  totalInternalUsers: number;
  internalUsersByRole: Record<InternalRole, number>;
  internalUsersByAuthority: Record<ComplaintAuthority, number>;
}
