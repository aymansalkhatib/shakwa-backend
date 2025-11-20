import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { ComplaintEntity } from '../entities/complaint.entity';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';

export interface IComplaintsRepository {
  create(data: ICreateComplaintData): Promise<ComplaintEntity>;

  findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>>;

  findById(id: number): Promise<ComplaintEntity | null>;

  findByIdWithLatestHistory(id: number): Promise<ComplaintEntity | null>;

  update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity>;

  exists(id: number): Promise<boolean>;

  getStatistics(): Promise<IComplaintStatistics>;
}
