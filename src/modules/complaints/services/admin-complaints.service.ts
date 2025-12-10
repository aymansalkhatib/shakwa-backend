import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { NotificationService } from '../../../shared/services/notifications/notification.service';
import { CitizensAdminService } from '../../citizens/services/citizens-admin.service';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { AdminComplaintFilterDto, UpdateComplaintInternalUserDto } from '../dtos';
import { ComplaintEntity } from '../entities';
import { ComplaintLockerRole } from '../enums';
import { sendStatusChangeNotification } from '../helpers/send-status-notification.helper';
import { IComplaintStatistics } from '../repositories';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { BaseComplaintsService } from './base-your-bucket-name.service';
import { CacheInvalidationService } from './cache-invalidation.service';

@Injectable()
export class AdminComplaintsService extends BaseComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
    private readonly notificationService: NotificationService,
    private readonly citizensService: CitizensAdminService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {
    super();
  }

  async findAll(
    filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    return await this.your-bucket-nameRepo.findAll(filterDto, ['citizen', 'internalUser']);
  }

  async findByIdWithHistory(id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithHistory(id, [
      'citizen',
      'internalUser',
    ]);
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async lockComplaint(admin: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    // Admin can lock even terminal your-bucket-name
    this.ensureNotTerminal(latestStatus);

    // Release any previous locks held by this admin member before locking the new complaint
    await this.releaseAllLocksForUser(admin.id);

    return this.your-bucket-nameRepo.lock(complaint.id, admin.id, ComplaintLockerRole.INTERNAL_USER);
  }

  async update(
    admin: InternalUserEntity,
    id: number,
    dto: UpdateComplaintInternalUserDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.findByIdWithLatestHistory(id);

    const latest = complaint.histories[0];
    const latestStatus = latest.status;

    // Admin can update terminal your-bucket-name (only status and note)
    // No ensureNotTerminal check here

    this.ensureLockOwner(complaint, admin.id, ComplaintLockerRole.INTERNAL_USER);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== latestStatus) {
      this.validateStatusTransition(latestStatus, dto.status);
    }

    const history = await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: admin.id,
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
      admin.id,
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

  async getStatistics(): Promise<IComplaintStatistics> {
    return await this.your-bucket-nameRepo.getStatistics();
  }

  async releaseAllLocksForUser(userId: number): Promise<void> {
    await this.your-bucket-nameRepo.releaseAllLocksForUser(userId, ComplaintLockerRole.INTERNAL_USER);
  }
}
