import { InternalRole } from '../../../../common/enums/role.enum';

/**
 * Interface for updating an internal user
 * Used by repository layer, independent of DTOs
 */
export interface IUpdateInternalUserData {
  fullName?: string;
  password?: string;
  role?: InternalRole;
  fcmToken?: string | null;
  lastLoginAt?: Date | null;
  lastLogoutAt?: Date | null;
  blockedAt?: Date | null;
  lastLoginIp?: string | null;
}
