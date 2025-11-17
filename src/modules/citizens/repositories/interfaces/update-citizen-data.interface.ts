/**
 * Interface for updating a citizen
 * Used by repository layer, independent of DTOs
 */
export interface IUpdateCitizenData {
  email?: string;
  phone?: string | null;
  password?: string;
  fullName?: string;
  blockedAt?: Date | null;
  lastLoginAt?: Date;
  lastLogoutAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
  fcmToken?: string | null;
}
