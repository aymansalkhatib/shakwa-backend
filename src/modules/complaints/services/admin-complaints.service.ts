import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { AdminComplaintFilterDto, UpdateComplaintContentDto } from '../dtos';
import { ComplaintEntity } from '../entities';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { BaseComplaintsService } from './base-your-bucket-name.service';
import { IComplaintStatistics } from '../repositories';

@Injectable()
export class AdminComplaintsService extends BaseComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
  ) {
    super();
  }

  async findAll(
    filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    return await this.your-bucket-nameRepo.findAll(filterDto as any);
  }

  async findOne(id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async lockComplaint(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findById(id, ['histories']);
    if (!complaint) throw new NotFoundException('Complaint not found');

    const latest = complaint.histories[complaint.histories.length - 1];
    const latestStatus = latest.status;

    this.ensureNotClosed(latestStatus);

    return this.your-bucket-nameRepo.lock(complaint.id, staff.id);
  }

  async updateContent(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintContentDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.findOne(id);

    const latest = complaint.histories[complaint.histories.length - 1];
    const latestStatus = latest.status;

    this.ensureNotClosed(latestStatus);

    this.ensureLockOwner(complaint.lockedByInternalUserId, complaint.lockedUntil, staff.id);

    const history = await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: staff.id,
      title: dto.title ?? latest.title,
      description: dto.description ?? latest?.description,
      status: dto.status ?? latestStatus,
      location: dto.location ?? latest?.location,
      attachments: dto.attachments ?? latest.attachments,
      note: dto.note ?? 'Content updated by staff.',
    });

    complaint.histories = [history];

    await this.your-bucket-nameRepo.releaseLock(complaint.id, staff.id);

    return complaint;
  }

  async getStatistics(): Promise<IComplaintStatistics> {
    return await this.your-bucket-nameRepo.getStatistics();
  }
}
