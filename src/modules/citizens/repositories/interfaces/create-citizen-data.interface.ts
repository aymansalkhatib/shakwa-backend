/**
 * Interface for creating a new citizen
 * Used by repository layer, independent of DTOs
 */
export interface ICreateCitizenData {
  email: string;
  phone: string;
  password: string;
  fullName: string;
}
