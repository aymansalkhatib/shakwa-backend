// File: src/modules/your-bucket-name/repositories/complaint-history.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import {
  IComplaintHistoryRepository,
  ICreateComplaintHistoryData,
} from './complaint-history.repository.interface';

@Injectable()
export class ComplaintHistoryRepository implements IComplaintHistoryRepository {
  constructor(
    @InjectRepository(ComplaintHistoryEntity)
    private readonly repository: Repository<ComplaintHistoryEntity>,
  ) {}

  async addEntry(data: ICreateComplaintHistoryData): Promise<ComplaintHistoryEntity> {
    const entity = this.repository.create({
      complaintId: data.complaintId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      note: data.note,
      changedByRole: data.changedByRole,
      changedByCitizenId: data.changedByCitizenId,
      changedByInternalUserId: data.changedByInternalUserId,
    });

    return await this.repository.save(entity);
  }

  async findByComplaintId(complaintId: number): Promise<ComplaintHistoryEntity[]> {
    return await this.repository.find({
      where: { complaintId },
      order: { createdAt: 'ASC' },
    });
  }
}
