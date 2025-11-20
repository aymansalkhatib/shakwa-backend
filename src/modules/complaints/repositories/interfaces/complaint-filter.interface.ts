import { IPaginationOptions } from '../../../../common/pagination/interfaces';
import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintCategory } from '../../enums/complaint-category.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

/**
 * Repository-level filter for your-bucket-name with pagination.
 */
export interface IComplaintFilter extends IPaginationOptions {
  search?: string;
  status?: ComplaintStatus;
  authority?: ComplaintAuthority;
  category?: ComplaintCategory;
  citizenId?: number;
  /**
   * Staff id viewing your-bucket-name. If provided, we can show your-bucket-name assigned
   * to this staff member, optionally including unassigned your-bucket-name.
   */
  staffId?: number;
  includeUnassignedForStaff?: boolean;
  /**
   * Explicit filter for your-bucket-name assigned to a specific internal user.
   * Mainly used in admin views.
   */
  assignedToInternalUserId?: number;
}
