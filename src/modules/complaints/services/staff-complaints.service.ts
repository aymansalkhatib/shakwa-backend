import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import {
  ComplaintResponseDto,
  StaffComplaintFilterDto,
  UpdateComplaintContentDto,
  UpdateComplaintStatusDto,
} from '../dtos';
import { ComplaintStatus } from '../enums';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import {
  ComplaintWithLatestHistory,
  IComplaintsRepository,
} from '../repositories/your-bucket-name.repository.interface';

@Injectable()
export class StaffComplaintsService {
  private readonly LOCK_TTL_MS = 30 * 60 * 1000;

  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
  ) {}

  async findAll(
    staff: InternalUserEntity,
    filterDto: StaffComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintWithLatestHistory>> {
    return await this.your-bucket-nameRepo.findAll({
      ...filterDto,
      authority: staff.authority,
    });
  }

  async findOne(staff: InternalUserEntity, id: number): Promise<ComplaintWithLatestHistory> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to access this complaint');
    }

    return complaint;
  }

  async lock(staff: InternalUserEntity, id: number): Promise<ComplaintWithLatestHistory> {
    let complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to lock this complaint');
    }

    const latestStatus = complaint.latestHistory?.status ?? ComplaintStatus.NEW;
    this.ensureNotClosed(latestStatus);

    this.ensureLockAvailable(complaint.lockedByInternalUserId, complaint.lockedAt, staff.id);

    complaint = await this.your-bucket-nameRepo.update(complaint, {
      lockedByInternalUserId: staff.id,
      lockedAt: new Date(),
    });

    return;
  }

  async unlock(staff: InternalUserEntity, id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to unlock this complaint');
    }

    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, staff.id);

    await this.your-bucket-nameRepo.update(complaint, {
      lockedByInternalUserId: null,
      lockedAt: null,
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async updateContent(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintContentDto,
  ): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to update this complaint');
    }

    const latest = complaint.latestHistory;
    const latestStatus = latest?.status ?? ComplaintStatus.NEW;

    this.ensureNotClosed(latestStatus);
    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, staff.id);

    await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: staff.id,
      title: dto.title ?? latest?.title ?? '',
      description: dto.description ?? latest?.description ?? '',
      status: latestStatus,
      location: dto.location ?? latest?.location ?? null,
      attachments: dto.attachments ?? latest?.attachments ?? [],
      note: 'Content updated by staff.',
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async updateStatus(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (complaint.authority !== staff.authority) {
      throw new ForbiddenException('You are not allowed to update this complaint');
    }

    const latest = complaint.latestHistory;
    const previousStatus = latest?.status ?? ComplaintStatus.NEW;
    const newStatus = dto.status;

    this.ensureNotClosed(previousStatus);
    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, staff.id);

    // Basic rule: can't move from terminal status
    if (this.isTerminalStatus(previousStatus)) {
      throw new BadRequestException('Closed your-bucket-name cannot be modified.');
    }

    await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: staff.id,
      title: latest?.title ?? '',
      description: latest?.description ?? '',
      status: newStatus,
      location: latest?.location ?? null,
      attachments: latest?.attachments ?? [],
      note: dto.note ?? null,
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  private ensureNotClosed(status: ComplaintStatus) {
    if (this.isTerminalStatus(status)) {
      throw new BadRequestException('Closed your-bucket-name cannot be modified.');
    }
  }

  private isTerminalStatus(status: ComplaintStatus): boolean {
    return (
      status === ComplaintStatus.RESOLVED ||
      status === ComplaintStatus.REJECTED ||
      status === ComplaintStatus.CANCELLED ||
      status === ComplaintStatus.CLOSED
    );
  }

  private isLockActive(lockedAt: Date | null): boolean {
    if (!lockedAt) return false;
    return Date.now() - lockedAt.getTime() < this.LOCK_TTL_MS;
  }

  private ensureLockAvailable(
    lockedById: number | null,
    lockedAt: Date | null,
    currentStaffId: number,
  ) {
    if (lockedById && lockedById !== currentStaffId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another staff member.');
    }
  }

  private ensureLockOwnerOrExpired(
    lockedById: number | null,
    lockedAt: Date | null,
    currentStaffId: number,
  ) {
    if (lockedById && lockedById !== currentStaffId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another staff member.');
    }
  }
}
