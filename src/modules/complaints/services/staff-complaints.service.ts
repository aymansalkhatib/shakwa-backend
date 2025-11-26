import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { NotificationService } from '../../../shared/services/notifications/notification.service';
import { CitizensAdminService } from '../../citizens/services/citizens-admin.service';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { StaffComplaintFilterDto, UpdateComplaintInternalUserDto } from '../dtos';
import { ComplaintStatisticsDto } from '../dtos/response/complaint-statistics.dto';
import { ComplaintEntity } from '../entities';
import { ComplaintLockerRole } from '../enums/complaint-locker-role.enum';
import { sendStatusChangeNotification } from '../helpers/send-status-notification.helper';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { BaseComplaintsService } from './base-your-bucket-name.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Injectable()
export class StaffComplaintsService extends BaseComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
    //
    private readonly notificationService: NotificationService,
    private readonly citizensService: CitizensAdminService,
    private readonly cacheInvalidation: CacheInvalidationService,
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
    const complaint = await this.your-bucket-nameRepo.findByIdWithHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to access this complaint');
    }

    return complaint;
  }

  async lockComplaint(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to update this complaint');
    }

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    this.ensureNotTerminal(latestStatus);

    return this.your-bucket-nameRepo.lock(complaint.id, staff.id, ComplaintLockerRole.INTERNAL_USER);
  }

  async update(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintInternalUserDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to update this complaint');
    }

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    this.ensureNotTerminal(latestStatus);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== latestStatus) {
      this.validateStatusTransition(latestStatus, dto.status);
    }

    this.ensureLockOwner(complaint, staff.id, ComplaintLockerRole.INTERNAL_USER);

    const history = await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: staff.id,
      title: latest.title,
      description: latest.description,
      status: dto.status ?? latestStatus,
      location: latest.location,
      attachments: latest.attachments,
      citizenNote: null,
      internalUserNote: dto.internalUserNote,
    });

    complaint.histories = [history];

    await this.your-bucket-nameRepo.releaseLock(
      complaint.id,
      staff.id,
      ComplaintLockerRole.INTERNAL_USER,
    );

    // Send notification if status changed
    if (dto.status && dto.status !== latestStatus) {
      await sendStatusChangeNotification(
        this.notificationService,
        this.citizensService,
        complaint.citizenId,
        complaint.id,
        dto.status,
      );
    }

    // Invalidate cache
    await this.cacheInvalidation.invalidateComplaintCaches(complaint.id);

    return complaint;
  }

  async getStatistics(staff: InternalUserEntity): Promise<ComplaintStatisticsDto> {
    return this.your-bucket-nameRepo.getStatistics(staff.authority);
  }
}
