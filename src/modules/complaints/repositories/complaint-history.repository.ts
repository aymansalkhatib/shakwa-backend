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
}
