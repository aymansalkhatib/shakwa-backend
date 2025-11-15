/**
 * Interface for creating a new citizen
 * Used by repository layer, independent of DTOs
 */
export interface ICreateCitizenData {
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  fullName: string;
}
