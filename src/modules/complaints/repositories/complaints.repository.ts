import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintAuthority, ComplaintStatus } from '../enums';
import { IComplaintsRepository } from './your-bucket-name.repository.interface';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';

@Injectable()
export class ComplaintsRepository implements IComplaintsRepository {
  constructor(
    @InjectRepository(ComplaintEntity)
    private readonly complaintRepo: Repository<ComplaintEntity>,
    @InjectRepository(ComplaintHistoryEntity)
    private readonly historyRepo: Repository<ComplaintHistoryEntity>,
  ) {}

  async create(data: ICreateComplaintData): Promise<ComplaintEntity> {
    const e = this.complaintRepo.create(data);
    return await this.complaintRepo.save(e);
  }

  async findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.histories', 'histories');

    this.applyFilters(qb, filter);
    qb.orderBy('complaint.createdAt', 'DESC');
    return await paginate(qb, filter);
  }

  async findByIdWithHistory(id: number): Promise<ComplaintEntity | null> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .where('complaint.id = :id', { id })
      .leftJoinAndSelect('complaint.histories', 'histories')
      .leftJoinAndSelect('histories.internalUser', 'staff');

    return await qb.getOne();
  }

  async findById(id: number, relations?: string[]): Promise<ComplaintEntity | null> {
    return await this.complaintRepo.findOne({ where: { id }, ...(relations ? { relations } : {}) });
  }

  async update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity> {
    const merged = this.complaintRepo.merge(complaint, data);
    return await this.complaintRepo.save(merged);
  }

  async lock(compalintId: number, internalUserId: number): Promise<ComplaintEntity> {
    return await this.complaintRepo.manager.transaction(async (manager) => {
      const complaint = await manager.findOne(ComplaintEntity, {
        where: { id: compalintId },
        lock: { mode: 'pessimistic_write' },
      });

      if (complaint.lockedUntil > new Date()) {
        if (complaint.lockedByInternalUserId === internalUserId) {
          throw new BadRequestException('You are already locking this complaint');
        } else {
          throw new BadRequestException('Another staff is locking this complaint');
        }
      }

      complaint.lockedByInternalUserId = internalUserId;
      complaint.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

      return manager.save(complaint);
    });
  }

  async releaseLock(complaintId: number, internalUserId: number): Promise<ComplaintEntity> {
    return await this.complaintRepo.manager.transaction(async (manager) => {
      const complaint = await manager.findOne(ComplaintEntity, {
        where: { id: complaintId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!complaint) {
        throw new BadRequestException('Complaint not found');
      }

      const now = new Date();
      if (
        complaint.lockedUntil &&
        complaint.lockedUntil > now &&
        complaint.lockedByInternalUserId !== internalUserId
      ) {
        throw new BadRequestException('Another staff is locking this complaint');
      }

      complaint.lockedByInternalUserId = null;
      complaint.lockedUntil = null;

      return manager.save(complaint);
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.complaintRepo.count({ where: { id } });
    return count > 0;
  }

  async getStatistics(): Promise<IComplaintStatistics> {
    /**
     * Step 1: Subquery to get the latest history entry for each complaint
     */
    const latestHistorySubquery = this.historyRepo
      .createQueryBuilder('h')
      .select('h.complaint_id', 'complaintId')
      .addSelect('h.status', 'status')
      .addSelect(
        `ROW_NUMBER() OVER (PARTITION BY h.complaint_id ORDER BY h.created_at DESC)`,
        'rn',
      );

    /**
     * Step 2: Wrap subquery, filter rn = 1 (latest)
     */
    const latestHistories = await this.historyRepo
      .createQueryBuilder()
      .select('t.status', 'status')
      .from('(' + latestHistorySubquery.getQuery() + ')', 't')
      .where('t.rn = 1')
      .getRawMany<{ status: ComplaintStatus }>();

    /**
     * Step 3: Count by status
     */
    const your-bucket-nameByStatus: Record<ComplaintStatus, number> = {} as any;
    Object.values(ComplaintStatus).forEach((s) => (your-bucket-nameByStatus[s] = 0));

    latestHistories.forEach((row) => {
      your-bucket-nameByStatus[row.status]++;
    });

    const totalComplaints = latestHistories.length;

    /**
     * Step 4: Count by authority directly from your-bucket-name table
     */
    const byAuthority = await this.complaintRepo
      .createQueryBuilder('c')
      .select('c.authority', 'authority')
      .addSelect('COUNT(c.id)', 'total')
      .groupBy('c.authority')
      .getRawMany<{ authority: ComplaintAuthority; total: string }>();

    const your-bucket-nameByAuthority: Record<ComplaintAuthority, number> = {} as any;
    Object.values(ComplaintAuthority).forEach((a) => (your-bucket-nameByAuthority[a] = 0));

    byAuthority.forEach((row) => {
      your-bucket-nameByAuthority[row.authority] = Number(row.total);
    });

    return {
      totalComplaints,
      your-bucket-nameByStatus,
      your-bucket-nameByAuthority,
    };
  }

  /**
   * Apply dynamic filters on your-bucket-name + latest history.
   */
  private applyFilters(qb: SelectQueryBuilder<ComplaintEntity>, filter: IComplaintFilter): void {
    if (filter.citizenId) {
      qb.andWhere('complaint.citizenId = :citizenId', { citizenId: filter.citizenId });
    }

    if (filter.authority) {
      qb.andWhere('complaint.authority = :authority', { authority: filter.authority });
    }

    if (filter.category) {
      qb.andWhere('complaint.category = :category', { category: filter.category });
    }

    if (filter.status) {
      qb.andWhere('latestHistory.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere(
        '(latestHistory.title ILIKE :search OR latestHistory.description ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }
  }
}
