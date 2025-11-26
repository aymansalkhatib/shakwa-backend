import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { CitizenComplaintFilterDto, CreateComplaintDto, UpdateMyComplaintDto } from '../dtos';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintLockerRole, ComplaintStatus } from '../enums';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { BaseComplaintsService } from './base-your-bucket-name.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Injectable()
export class CitizenComplaintsService extends BaseComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {
    super();
  }

  async create(citizen: CitizenEntity, dto: CreateComplaintDto): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const complaintRepo = this.your-bucket-nameRepo.withManager(manager);
      const historyRepo = this.historyRepo.withManager(manager);

      const complaint = await complaintRepo.create({ ...dto, citizenId: citizen.id });
      const history = await historyRepo.addEntry({
        ...dto,
        complaintId: complaint.id,
        status: ComplaintStatus.NEW,
        citizenNote: 'Complaint created by citizen.',
      });

      complaint.histories = [history];

      // Invalidate cache
      await this.cacheInvalidation.invalidateComplaintCaches();

      return complaint;
    });
  }

  async findAll(
    citizen: CitizenEntity,
    filterDto: CitizenComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    return await this.your-bucket-nameRepo.findAll({
      ...filterDto,
      citizenId: citizen.id,
    });
  }

  async findOne(citizen: CitizenEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithHistory(id);
    if (!complaint || complaint.citizenId !== citizen.id) {
      throw new NotFoundException('Complaint not found');
    }
    return complaint;
  }

  async lockComplaint(citizen: CitizenEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);

    if (!complaint || complaint.citizenId !== citizen.id) {
      throw new NotFoundException('Complaint not found');
    }

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    this.ensureNotTerminal(latestStatus);

    return this.your-bucket-nameRepo.lock(complaint.id, citizen.id, ComplaintLockerRole.CITIZEN);
  }

  async update(
    citizen: CitizenEntity,
    id: number,
    dto: UpdateMyComplaintDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);

    if (!complaint || complaint.citizenId !== citizen.id) {
      throw new NotFoundException('Complaint not found');
    }

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    this.ensureNotTerminal(latestStatus);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== latestStatus) {
      this.validateStatusTransition(latestStatus, dto.status);
    }

    this.ensureLockOwner(complaint, citizen.id, ComplaintLockerRole.CITIZEN);

    const history = await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: null,
      title: latest.title,
      description: latest.description,
      status: dto.status ?? latestStatus,
      location: dto.location ?? latest?.location,
      attachments: dto.attachments ?? latest?.attachments,
      citizenNote: dto.citizenNote,
      internalUserNote: null,
    });

    complaint.histories = [history];

    await this.your-bucket-nameRepo.releaseLock(complaint.id, citizen.id, ComplaintLockerRole.CITIZEN);

    // Invalidate cache
    await this.cacheInvalidation.invalidateComplaintCaches(complaint.id);

    return complaint;
  }
}
