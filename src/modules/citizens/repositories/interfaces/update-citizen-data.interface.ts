/**
 * Interface for updating a citizen
 * Used by repository layer, independent of DTOs
 */
export interface IUpdateCitizenData {
  phone?: string | null;
  password?: string;
  fullName?: string;
  blockedAt?: Date | null;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
  lastLoginIp?: string;
  fcmToken?: string | null;
}
