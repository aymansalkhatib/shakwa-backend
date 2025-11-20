import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintAuthority, ComplaintStatus } from '../enums';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';
import { IComplaintsRepository } from './your-bucket-name.repository.interface';

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
    const qb = this.complaintRepo.createQueryBuilder('complaint');
    this.joinLatestHistory(qb);
    this.applyFilters(qb, filter);
    qb.orderBy('complaint.createdAt', 'DESC');
    return await paginate(qb, filter);
  }

  async findByIdWithLatestHistory(id: number): Promise<ComplaintEntity | null> {
    const qb = this.complaintRepo
      .createQueryBuilder('complaint')
      .where('complaint.id = :id', { id });
    this.joinLatestHistory(qb);

    return await qb.getOne();
  }

  async findById(id: number): Promise<ComplaintEntity | null> {
    return await this.complaintRepo.findOne({ where: { id } });
  }

  async update(complaint: ComplaintEntity, data: IUpdateComplaintData): Promise<ComplaintEntity> {
    const merged = this.complaintRepo.merge(complaint, data);
    return await this.complaintRepo.save(merged);
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.complaintRepo.count({ where: { id } });
    return count > 0;
  }

  async getStatistics(): Promise<IComplaintStatistics> {
    // Subquery to get last status per complaint
    const latestHistorySub = this.historyRepo
      .createQueryBuilder('h')
      .distinctOn(['h.complaintId'])
      .orderBy('h.complaintId', 'ASC')
      .addOrderBy('h.createdAt', 'DESC');

    const raw = await this.complaintRepo
      .createQueryBuilder('complaint')
      .leftJoin(
        '(' + latestHistorySub.getQuery() + ')',
        'latestHistory',
        'latestHistory.complaint_id = complaint.id',
      )
      .setParameters(latestHistorySub.getParameters())
      .select('COUNT(complaint.id)', 'total')
      .addSelect('latestHistory.status', 'status')
      .addSelect('complaint.authority', 'authority')
      .groupBy('latestHistory.status')
      .addGroupBy('complaint.authority')
      .getRawMany<{
        total: string;
        status: ComplaintStatus | null;
        authority: ComplaintAuthority;
      }>();

    // Initialize maps
    const your-bucket-nameByStatus = {} as Record<ComplaintStatus, number>;
    Object.values(ComplaintStatus).forEach((s) => (your-bucket-nameByStatus[s] = 0));
    const your-bucket-nameByAuthority = {} as Record<ComplaintAuthority, number>;
    Object.values(ComplaintAuthority).forEach((a) => (your-bucket-nameByAuthority[a] = 0));

    let totalComplaints = 0;

    raw.forEach((r) => {
      const c = Number(r.total) || 0;
      totalComplaints += c;
      if (r.status) {
        your-bucket-nameByStatus[r.status] = (your-bucket-nameByStatus[r.status] ?? 0) + c;
      }
      if (r.authority) {
        your-bucket-nameByAuthority[r.authority] = (your-bucket-nameByAuthority[r.authority] ?? 0) + c;
      }
    });

    return { totalComplaints, your-bucket-nameByStatus, your-bucket-nameByAuthority };
  }

  /**
   * Join latest history snapshot as complaint.latestHistory.
   * We use Postgres DISTINCT ON for efficiency.
   */
  private joinLatestHistory(qb: SelectQueryBuilder<ComplaintEntity>): void {
    const latestHistorySub = this.historyRepo
      .createQueryBuilder('h')
      .distinctOn(['h.complaintId'])
      .orderBy('h.complaintId', 'ASC')
      .addOrderBy('h.createdAt', 'DESC');

    qb.leftJoinAndMapOne(
      'complaint.latestHistory',
      '(' + latestHistorySub.getQuery() + ')',
      'latestHistory',
      'latestHistory.complaint_id = complaint.id',
    ).setParameters(latestHistorySub.getParameters());
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
