// File: src/modules/your-bucket-name/repositories/your-bucket-name.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { ComplaintEntity } from '../entities/complaint.entity';
import { IComplaintsRepository } from './your-bucket-name.repository.interface';
import {
  IComplaintFilter,
  IComplaintStatistics,
  ICreateComplaintData,
  IUpdateComplaintData,
} from './interfaces';
import { ComplaintAuthority } from '../enums/complaint-authority.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';

@Injectable()
export class ComplaintsRepository implements IComplaintsRepository {
  constructor(
    @InjectRepository(ComplaintEntity)
    private readonly repository: Repository<ComplaintEntity>,
  ) {}

  async create(data: ICreateComplaintData): Promise<ComplaintEntity> {
    const complaint = this.repository.create({
      referenceNumber: data.referenceNumber,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      authority: data.authority,
      locationText: data.locationText ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      attachments: data.attachments ?? [],
      citizenId: data.citizenId,
      assignedToInternalUserId: data.assignedToInternalUserId ?? null,
      lockedByInternalUserId: data.lockedByInternalUserId ?? null,
      lockedAt: data.lockedAt ?? null,
      closedAt: data.closedAt ?? null,
    });

    return await this.repository.save(complaint);
  }

  async findAll(filter: IComplaintFilter): Promise<IPaginatedResponse<ComplaintEntity>> {
    const qb = this.repository.createQueryBuilder('complaint');
    this.applyFilters(qb, filter);
    return await paginate(qb, filter);
  }

  async findById(id: number): Promise<ComplaintEntity | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async update(
    complaint: ComplaintEntity,
    data: IUpdateComplaintData,
  ): Promise<ComplaintEntity> {
    const merged = this.repository.merge(complaint, data);
    return await this.repository.save(merged);
  }

  async getStatistics(): Promise<IComplaintStatistics> {
    const totalComplaints = await this.repository.count();

    // Stats by status
    const statusRows = await this.repository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('complaint.status')
      .getRawMany<{ status: ComplaintStatus; count: string }>();

    const your-bucket-nameByStatus: Record<ComplaintStatus, number> = {} as Record<
      ComplaintStatus,
      number
    >;
    Object.values(ComplaintStatus).forEach((status) => {
      your-bucket-nameByStatus[status] = 0;
    });
    statusRows.forEach((row) => {
      const status = row.status as ComplaintStatus;
      your-bucket-nameByStatus[status] = Number(row.count) || 0;
    });

    // Stats by authority
    const authorityRows = await this.repository
      .createQueryBuilder('complaint')
      .select('complaint.authority', 'authority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('complaint.authority')
      .getRawMany<{ authority: ComplaintAuthority; count: string }>();

    const your-bucket-nameByAuthority: Record<ComplaintAuthority, number> = {} as Record<
      ComplaintAuthority,
      number
    >;
    Object.values(ComplaintAuthority).forEach((authority) => {
      your-bucket-nameByAuthority[authority] = 0;
    });
    authorityRows.forEach((row) => {
      const authority = row.authority as ComplaintAuthority;
      your-bucket-nameByAuthority[authority] = Number(row.count) || 0;
    });

    return {
      totalComplaints,
      your-bucket-nameByStatus,
      your-bucket-nameByAuthority,
    };
  }

  /**
   * Applies filters to the query builder.
   */
  private applyFilters(
    qb: SelectQueryBuilder<ComplaintEntity>, 
    filter: IComplaintFilter,
  ): void {
    // Search by title, description, or reference number
    if (filter.search) {
      qb.andWhere(
        '(complaint.title ILIKE :search OR complaint.description ILIKE :search OR complaint.referenceNumber ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    if (filter.status) {
      qb.andWhere('complaint.status = :status', { status: filter.status });
    }

    if (filter.authority) {
      qb.andWhere('complaint.authority = :authority', { authority: filter.authority });
    }

    if (filter.priority) {
      qb.andWhere('complaint.priority = :priority', { priority: filter.priority });
    }

    if (filter.category) {
      qb.andWhere('complaint.category = :category', { category: filter.category });
    }

    if (filter.citizenId) {
      qb.andWhere('complaint.citizenId = :citizenId', { citizenId: filter.citizenId });
    }

    // Staff view (assigned + optionally unassigned)
    if (filter.staffId) {
      if (filter.includeUnassignedForStaff) {
        qb.andWhere(
          '(complaint.assignedToInternalUserId IS NULL OR complaint.assignedToInternalUserId = :staffId)',
          { staffId: filter.staffId },
        );
      } else {
        qb.andWhere('complaint.assignedToInternalUserId = :staffId', {
          staffId: filter.staffId,
        });
      }
    }

    // Explicit filter for assignedToInternalUserId (admin views)
    if (typeof filter.assignedToInternalUserId === 'number') {
      qb.andWhere(
        'complaint.assignedToInternalUserId = :assignedToInternalUserId',
        { assignedToInternalUserId: filter.assignedToInternalUserId },
      );
    }

    qb.orderBy('complaint.createdAt', 'DESC');
  }
}
