import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ICreateComplaintHistoryData } from './interfaces';

export interface IComplaintHistoryRepository {
  addEntry(data: ICreateComplaintHistoryData): Promise<ComplaintHistoryEntity>;
}
