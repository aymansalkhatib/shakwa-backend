// File: src/modules/your-bucket-name/services/admin-your-bucket-name.service.ts

import {
  BadRequestException,
  ConflictException,
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
  AdminComplaintFilterDto,
  UpdateComplaintStatusDto,
  UpdateComplaintContentDto,
  UpdateComplaintBaseDto,
  ComplaintResponseDto,
  ComplaintHistoryResponseDto,
} from '../dtos';
import { ComplaintStatus } from '../enums';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';

@Injectable()
export class AdminComplaintsService {
  private readonly LOCK_TTL_MS = 30 * 60 * 1000; // 30 min

  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
  ) {}

  async findAll(
    filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<any>> {
    return await this.your-bucket-nameRepo.findAll(filterDto as any);
  }

  async findOne(id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');
    return new ComplaintResponseDto(complaint);
  }

  async getHistory(id: number): Promise<ComplaintHistoryResponseDto[]> {
    const histories = await this.historyRepo.findByComplaintId(id);
    return histories.map((h) => new ComplaintHistoryResponseDto(h));
  }

  async lock(admin: InternalUserEntity, id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    const latestStatus = complaint.latestHistory?.status ?? ComplaintStatus.NEW;
    this.ensureNotClosed(latestStatus);
    this.ensureLockAvailable(complaint.lockedByInternalUserId, complaint.lockedAt, admin.id);

    await this.your-bucket-nameRepo.update(complaint, {
      lockedByInternalUserId: admin.id,
      lockedAt: new Date(),
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async unlock(admin: InternalUserEntity, id: number): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, admin.id);

    await this.your-bucket-nameRepo.update(complaint, {
      lockedByInternalUserId: null,
      lockedAt: null,
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async updateContent(
    admin: InternalUserEntity,
    id: number,
    dto: UpdateComplaintContentDto,
  ): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    const latest = complaint.latestHistory;
    const latestStatus = latest?.status ?? ComplaintStatus.NEW;

    this.ensureNotClosed(latestStatus);
    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, admin.id);

    await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: admin.id,
      title: dto.title ?? latest?.title ?? '',
      description: dto.description ?? latest?.description ?? '',
      status: latestStatus,
      location: dto.location ?? latest?.location ?? null,
      attachments: dto.attachments ?? latest?.attachments ?? [],
      note: 'Content updated by admin.',
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async updateStatus(
    admin: InternalUserEntity,
    id: number,
    dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    const latest = complaint.latestHistory;
    const previousStatus = latest?.status ?? ComplaintStatus.NEW;

    this.ensureNotClosed(previousStatus);
    this.ensureLockOwnerOrExpired(complaint.lockedByInternalUserId, complaint.lockedAt, admin.id);

    if (this.isTerminalStatus(previousStatus)) {
      throw new BadRequestException('Closed your-bucket-name cannot be modified.');
    }

    await this.historyRepo.addEntry({
      complaintId: id,
      internalUserId: admin.id,
      title: latest?.title ?? '',
      description: latest?.description ?? '',
      status: dto.status,
      location: latest?.location ?? null,
      attachments: latest?.attachments ?? [],
      note: dto.note ?? null,
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  /**
   * تعديل الحقول الأساسية داخل your-bucket-name (category/authority).
   * سننشىء history جديدة إذا تغيّر الـ authority أو category ؟
   * بما أن history لا يحتوي هذه الحقول في النسخة الحالية، سنكتفي بتعديل your-bucket-name.
   */
  async updateBase(
    admin: InternalUserEntity,
    id: number,
    dto: UpdateComplaintBaseDto,
  ): Promise<ComplaintResponseDto> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    await this.your-bucket-nameRepo.update(complaint, {
      category: dto.category ?? complaint.category,
      authority: dto.authority ?? complaint.authority,
    });

    const full = await this.your-bucket-nameRepo.findById(id);
    return new ComplaintResponseDto(full!);
  }

  async getStatistics() {
    return await this.your-bucket-nameRepo.getStatistics();
  }

  // -----------------------------------------------------------------------
  // Lock helpers
  // -----------------------------------------------------------------------

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
    currentId: number,
  ) {
    if (lockedById && lockedById !== currentId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another internal user.');
    }
  }

  private ensureLockOwnerOrExpired(
    lockedById: number | null,
    lockedAt: Date | null,
    currentId: number,
  ) {
    if (lockedById && lockedById !== currentId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another internal user.');
    }
  }
}
