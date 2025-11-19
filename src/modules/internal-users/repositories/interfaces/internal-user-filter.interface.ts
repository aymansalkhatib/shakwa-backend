import { IPaginationOptions } from '../../../../common/pagination/interfaces';
import { InternalRole } from '../../../../common/enums/role.enum';

/**
 * Interface for filtering internal users
 * Used by repository layer, independent of DTOs
 */
export interface IInternalUserFilter extends IPaginationOptions {
  fullName?: string;
  email?: string;
  role?: InternalRole;
}
