import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintAuthority, ComplaintLockerRole, ComplaintStatus } from '../enums';
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

  //TODO
  async findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoinAndSelect(
        'complaint.histories',
        'lastHistory',
        'lastHistory.id = (SELECT h.id FROM complaint_histories h WHERE h.complaint_id = complaint.id ORDER BY h.created_at DESC LIMIT 1)',
      );

    this.applyFilters(qb, filter);
    qb.orderBy('complaint.createdAt', 'DESC');

    return await paginate(qb, filter);
  }

  async findByIdWithHistory(id: number): Promise<ComplaintEntity | null> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .where('complaint.id = :id', { id })
      .leftJoinAndSelect('complaint.histories', 'histories');

    return await qb.getOne();
  }

  async findByIdWithLatestHistory(id: number): Promise<ComplaintEntity | null> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .where('complaint.id = :id', { id })
      .leftJoinAndSelect(
        'complaint.histories',
        'lastHistory',
        'lastHistory.id = (SELECT h.id FROM complaint_histories h WHERE h.complaint_id = complaint.id ORDER BY h.created_at DESC LIMIT 1)',
      );

    return await qb.getOne();
  }


  async update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity> {
    const merged = this.complaintRepo.merge(complaint, data);
    return await this.complaintRepo.save(merged);
  }

  async lock(
    id: number,
    lockerId: number,
    lockerRole: ComplaintLockerRole,
  ): Promise<ComplaintEntity> {
    return await this.complaintRepo.manager.transaction(async (manager) => {
      const complaint = await manager.findOne(ComplaintEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!complaint) throw new NotFoundException('Complaint not found');

      if (complaint.lockedById && complaint.lockedUntil && complaint.lockedUntil > new Date()) {
        if (complaint.lockedById !== lockerId || complaint.lockedByRole !== lockerRole) {
          throw new ConflictException('Complaint is already locked by another user');
        }
      }

      complaint.lockedById = lockerId;
      complaint.lockedByRole = lockerRole;
      complaint.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes lock

      return manager.save(complaint);
    });
  }

  async releaseLock(id: number, lockerId: number, lockerRole: ComplaintLockerRole): Promise<void> {
    await this.complaintRepo.manager.transaction(async (manager) => {
      const complaint = await manager.findOne(ComplaintEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!complaint) return;

      if (complaint.lockedById === lockerId && complaint.lockedByRole === lockerRole) {
        complaint.lockedById = null;
        complaint.lockedByRole = null;
        complaint.lockedUntil = null;
        await manager.save(complaint);
      }
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.complaintRepo.count({ where: { id } });
    return count > 0;
  }

  //TODO
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
      qb.andWhere('lastHistory.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere('(lastHistory.title ILIKE :search OR lastHistory.description ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
  }

  withManager(manager: EntityManager): IComplaintsRepository {
    const complaintRepo = manager.getRepository(ComplaintEntity);
    const historyRepo = manager.getRepository(ComplaintHistoryEntity);
    return new ComplaintsRepository(complaintRepo, historyRepo);
  }
}
