import { EntityManager } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintLockerRole } from '../enums/complaint-locker-role.enum';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';

export interface IComplaintsRepository {
  create(data: ICreateComplaintData): Promise<ComplaintEntity>;

  findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>>;

  findByIdWithHistory(id: number): Promise<ComplaintEntity | null>;

  findByIdWithLatestHistory(id: number): Promise<ComplaintEntity | null>;

  update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity>;

  exists(id: number): Promise<boolean>;

  getStatistics(): Promise<IComplaintStatistics>;

  lock(id: number, lockerId: number, lockerRole: ComplaintLockerRole): Promise<ComplaintEntity>;

  releaseLock(id: number, lockerId: number, lockerRole: ComplaintLockerRole): Promise<void>;

  withManager(manager: EntityManager): IComplaintsRepository;
}
