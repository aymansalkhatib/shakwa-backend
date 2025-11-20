import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { StaffComplaintFilterDto, UpdateComplaintContentDto } from '../dtos';
import { ComplaintEntity } from '../entities';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { BaseComplaintsService } from './base-your-bucket-name.service';

@Injectable()
export class StaffComplaintsService extends BaseComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
  ) {
    super();
  }

  async findAll(
    staff: InternalUserEntity,
    filterDto: StaffComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    return await this.your-bucket-nameRepo.findAll({
      ...filterDto,
      authority: staff.authority,
    });
  }

  async findOne(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to access this complaint');
    }

    return complaint;
  }

  async updateContent(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintContentDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to update this complaint');
    }

    const latest = complaint.histories[complaint.histories.length - 1];
    const latestStatus = latest.status;

    this.ensureNotClosed(latestStatus);

    this.ensureLockOwnerOrExpired(
      complaint.lockedByInternalUserId,
      complaint.lockedUntil,
      staff.id,
    );

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
    return complaint;
  }
}
