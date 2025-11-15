/**
 * Interface for updating a citizen
 * Used by repository layer, independent of DTOs
 */
export interface IUpdateCitizenData {
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  fullName?: string;
  blockedAt?: Date | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  passwordChangedAt?: Date;
}
