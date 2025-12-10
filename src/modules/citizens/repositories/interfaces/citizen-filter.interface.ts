import { IPaginationOptions } from '../../../../common/pagination/interfaces';

/**
 * Interface for filtering citizens
 * Used by repository layer, independent of DTOs
 */
export interface ICitizenFilter extends IPaginationOptions {
  id?: number;
  search?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  blocked?: boolean;
}
