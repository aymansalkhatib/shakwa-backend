import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { IComplaintHistoryRepository } from './complaint-history.repository.interface';
import { ICreateComplaintHistoryData } from './interfaces';

@Injectable()
export class ComplaintHistoryRepository implements IComplaintHistoryRepository {
  constructor(
    @InjectRepository(ComplaintHistoryEntity)
    private readonly historyRepo: Repository<ComplaintHistoryEntity>,
  ) {}

  async addEntry(data: ICreateComplaintHistoryData): Promise<ComplaintHistoryEntity> {
    const entry = this.historyRepo.create(data);
    return await this.historyRepo.save(entry);
  }

  async findByComplaintId(complaintId: number): Promise<ComplaintHistoryEntity[]> {
    return await this.historyRepo.find({
      where: { complaintId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByComplaintId(complaintId: number): Promise<ComplaintHistoryEntity | null> {
    return await this.historyRepo.findOne({
      where: { complaintId },
      order: { createdAt: 'DESC' },
    });
  }
}
