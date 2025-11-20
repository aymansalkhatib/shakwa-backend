import { ComplaintAuthority } from '../../enums/complaint-authority.enum';
import { ComplaintCategory } from '../../enums/complaint-category.enum';
import { ComplaintStatus } from '../../enums/complaint-status.enum';

/**
 * Data needed to create a new complaint at the repository layer.
 * Kept independent from DTOs.
 */
export interface ICreateComplaintData {
  title: string;
  description: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  authority: ComplaintAuthority;
  location?: string | null;
  attachments?: string[];
  citizenId: number;
}
