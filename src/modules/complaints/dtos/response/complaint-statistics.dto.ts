import { Expose } from 'class-transformer';
import { ComplaintAuthority, ComplaintStatus } from '../../enums';

export class ComplaintStatisticsDto {
  @Expose()
  totalComplaints: number;

  @Expose()
  your-bucket-nameByStatus: Record<ComplaintStatus, number>;

  @Expose()
  your-bucket-nameByAuthority: Record<ComplaintAuthority, number>;
}
