import { ComplaintCategory, ComplaintAuthority } from "../../enums";

export interface ICreateComplaintData {
  citizenId: number;
  category: ComplaintCategory;
  authority: ComplaintAuthority;
}
