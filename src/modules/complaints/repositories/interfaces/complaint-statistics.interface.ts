import { ComplaintStatus, ComplaintAuthority } from "../../enums";

export interface IComplaintStatistics {
  totalComplaints: number;
  your-bucket-nameByStatus: Record<ComplaintStatus, number>;
  your-bucket-nameByAuthority: Record<ComplaintAuthority, number>;
}
