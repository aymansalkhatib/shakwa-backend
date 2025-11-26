import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async getStatistics(authority?: ComplaintAuthority): Promise<IComplaintStatistics> {
    // 1. Initialize result objects with zero values to ensure all keys exist for the frontend
    const your-bucket-nameByStatus = this.initEnumCounter(ComplaintStatus);
    const your-bucket-nameByAuthority = this.initEnumCounter(ComplaintAuthority);

    // 2. Execute all queries in parallel to minimize latency
    const [statusStatsRaw, authorityStatsRaw, totalComplaints] = await Promise.all([
      this.fetchStatusStatistics(authority),
      this.fetchAuthorityStatistics(authority),
      authority ? this.complaintRepo.count({ where: { authority } }) : this.complaintRepo.count(), // Fast count of total rows
    ]);

    // 3. Map raw DB results to the structured response objects
    statusStatsRaw.forEach((row) => {
      if (your-bucket-nameByStatus[row.status] != undefined) {
        your-bucket-nameByStatus[row.status] = Number(row.count);
      }
    });

    authorityStatsRaw.forEach((row) => {
      if (your-bucket-nameByAuthority[row.authority] != undefined) {
        your-bucket-nameByAuthority[row.authority] = Number(row.count);
      }
    });

    return {
      totalComplaints,
      your-bucket-nameByStatus,
      your-bucket-nameByAuthority,
    };
  }

  /**
   * Fetches the count of your-bucket-name grouped by their *latest* status.
   * Uses a Window Function to find the latest history without fetching all data.
   */
  private async fetchStatusStatistics(authority?: ComplaintAuthority) {
    // Inner Query: Rank histories by creation date for each complaint
    const subQuery = this.historyRepo
      .createQueryBuilder('h')
      .select('h.status', 'status')
      .addSelect(
        'ROW_NUMBER() OVER (PARTITION BY h.complaint_id ORDER BY h.created_at DESC)',
        'rn',
      );

    if (authority) {
      subQuery.innerJoin('h.complaint', 'c').where('c.authority = :authority', { authority });
    }

    // Outer Query: Filter for rank 1 (latest), Group by Status, and Count
    return await this.historyRepo.manager
      .createQueryBuilder()
      .select('ranked.status', 'status')
      .addSelect('COUNT(ranked.status)', 'count')
      .from('(' + subQuery.getQuery() + ')', 'ranked') // Wrap subquery
      .setParameters(subQuery.getParameters()) // Pass parameters from subquery
      .where('ranked.rn = 1') // Only consider the latest entry
      .groupBy('ranked.status')
      .getRawMany<{ status: ComplaintStatus; count: string }>();
  }

  /**
   * Fetches the count of your-bucket-name grouped by authority.
   * Performed directly on the your-bucket-name table.
   */
  private async fetchAuthorityStatistics(authority?: ComplaintAuthority) {
    const qb = this.complaintRepo
      .createQueryBuilder('c')
      .select('c.authority', 'authority')
      .addSelect('COUNT(c.id)', 'count')
      .groupBy('c.authority');

    if (authority) {
      qb.where('c.authority = :authority', { authority });
    }

    return await qb.getRawMany<{ authority: ComplaintAuthority; count: string }>();
  }

  /**
   * Helper to create an object with all Enum keys set to 0.
   * Prevents "undefined" values in the response.
   */
  private initEnumCounter = <T extends Record<string, any>>(enumObj: T) => {
    const counter: any = {};
    Object.values(enumObj).forEach((v) => (counter[v] = 0));
    return counter as Record<T[keyof T], number>;
  };
}
