import { InternalRole } from '../../../../common/enums/role.enum';

/**
 * Interface for updating an internal user
 * Used by repository layer, independent of DTOs
 */
export interface IUpdateInternalUserData {
  fullName?: string;
  password?: string;
  role?: InternalRole;
}

