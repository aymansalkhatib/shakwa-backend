import { InternalRole } from '../../../../common/enums/role.enum';

/**
 * Interface for creating a new internal user
 * Used by repository layer, independent of DTOs
 */
export interface ICreateInternalUserData {
  fullName: string;
  email: string;
  password: string;
  role: InternalRole;
}

