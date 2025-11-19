// File: src/modules/your-bucket-name/repositories/your-bucket-name.repository.interface.ts

import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { ComplaintEntity } from '../entities/complaint.entity';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';

export interface IComplaintsRepository {
  /**
   * Creates a new complaint.
   */
  create(data: ICreateComplaintData): Promise<ComplaintEntity>;

  /**
   * Finds your-bucket-name with pagination & filtering.
   */
  findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>>;

  /**
   * Finds a complaint by its ID.
   */
  findById(id: number): Promise<ComplaintEntity | null>;

  /**
   * Updates a complaint.
   */
  update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity>;

  /**
   * Aggregated statistics.
   */
  getStatistics(): Promise<IComplaintStatistics>;
}
