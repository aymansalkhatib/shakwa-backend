import { InternalRole } from '../../../../common/enums/role.enum';

/**
 * Interface for internal user statistics
 * Used by repository layer for aggregated data
 */
export interface IInternalUserStatistics {
  totalInternalUsers: number;
  internalUsersByRole: Record<InternalRole, number>;
}
