// File: src/modules/your-bucket-name/services/your-bucket-name-base.service.ts

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InternalRoleToRoleMap, Role } from '../../../common/enums/role.enum';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import {
  IComplaintHistoryRepository,
  ICreateComplaintHistoryData,
} from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { IComplaintStatistics } from '../repositories/interfaces';

@Injectable()
export abstract class BaseComplaintsService {
  /**
   * مدة صلاحية القفل بالميلي ثانية
   * بعد انتهائها يمكن لموظف آخر الحصول على القفل.
   */
  protected readonly LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    protected readonly your-bucket-nameRepository: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    protected readonly complaintHistoryRepository: IComplaintHistoryRepository,
  ) {}

  // -----------------------------------------------------------------------
  // عمليات مشتركة
  // -----------------------------------------------------------------------

  protected generateReferenceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return 'CMP-' + year + month + day + '-' + randomPart;
  }

  protected async addHistory(data: ICreateComplaintHistoryData): Promise<void> {
    await this.complaintHistoryRepository.addEntry(data);
  }

  protected ensureNotClosed(complaint: ComplaintEntity): void {
    if (this.isTerminalStatus(complaint.status)) {
      throw new BadRequestException('Closed your-bucket-name cannot be modified.');
    }
  }

  protected isTerminalStatus(status: ComplaintStatus): boolean {
    return (
      status === ComplaintStatus.RESOLVED ||
      status === ComplaintStatus.REJECTED ||
      status === ComplaintStatus.CANCELLED ||
      status === ComplaintStatus.CLOSED
    );
  }

  protected isLockActive(complaint: ComplaintEntity): boolean {
    if (!complaint.lockedAt) return false;
    const now = Date.now();
    return now - complaint.lockedAt.getTime() < this.LOCK_TTL_MS;
  }

  protected ensureLockAvailable(complaint: ComplaintEntity, staff: InternalUserEntity): void {
    if (
      complaint.lockedByInternalUserId &&
      complaint.lockedByInternalUserId !== staff.id &&
      this.isLockActive(complaint)
    ) {
      throw new ConflictException(
        'Complaint is currently being processed by another staff member.',
      );
    }
  }

  protected mapInternalRoleToRole(internalUser: InternalUserEntity): Role {
    return InternalRoleToRoleMap[internalUser.role];
  }

  // -----------------------------------------------------------------------
  // عمليات يمكن أن يستخدمها الـ Admin (إحصائيات وتاريخ)
  // -----------------------------------------------------------------------

  async getStatistics(): Promise<IComplaintStatistics> {
    return await this.your-bucket-nameRepository.getStatistics();
  }

  async getHistory(id: number): Promise<ComplaintHistoryEntity[]> {
    const complaint = await this.your-bucket-nameRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    return await this.complaintHistoryRepository.findByComplaintId(id);
  }
}
