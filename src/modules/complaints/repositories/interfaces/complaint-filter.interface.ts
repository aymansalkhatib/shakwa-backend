import { IPaginationOptions } from '../../../../common/pagination/interfaces';
import { ComplaintStatus, ComplaintCategory, ComplaintAuthority } from '../../enums';

export interface IComplaintFilter extends IPaginationOptions {
  search?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  authority?: ComplaintAuthority;
  citizenId?: number;
}
