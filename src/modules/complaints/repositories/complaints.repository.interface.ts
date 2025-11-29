import { EntityManager } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintAuthority, ComplaintLockerRole } from '../enums';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';

export interface IComplaintsRepository {
  create(data: ICreateComplaintData): Promise<ComplaintEntity>;

  findAll(
    filter: IComplaintFilter,
    relations?: string[],
  ): Promise<IPaginatedResponse<ComplaintEntity>>;

  findByIdWithHistory(id: number, relations?: string[]): Promise<ComplaintEntity | null>;

  findByIdWithLatestHistory(id: number, relations?: string[]): Promise<ComplaintEntity | null>;

  update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity>;

  exists(id: number): Promise<boolean>;

  getStatistics(authority?: ComplaintAuthority): Promise<IComplaintStatistics>;

  lock(id: number, lockerId: number, lockerRole: ComplaintLockerRole): Promise<ComplaintEntity>;

  releaseLock(id: number, lockerId: number, lockerRole: ComplaintLockerRole): Promise<void>;

  releaseAllLocksForUser(lockerId: number, lockerRole: ComplaintLockerRole): Promise<number>;

  withManager(manager: EntityManager): IComplaintsRepository;
}
