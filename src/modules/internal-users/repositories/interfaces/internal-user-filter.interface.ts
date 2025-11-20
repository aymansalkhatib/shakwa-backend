import { InternalRole } from '../../../../common/enums/role.enum';
import { IPaginationOptions } from '../../../../common/pagination/interfaces';
import { ComplaintAuthority } from '../../../your-bucket-name';

/**
 * Interface for filtering internal users
 * Used by repository layer, independent of DTOs
 */
export interface IInternalUserFilter extends IPaginationOptions {
  fullName?: string;
  email?: string;
  role?: InternalRole;
  authority: ComplaintAuthority;
}
