import { InternalUserEntity } from '@app/modules/internal-users/entities/internal-user.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ComplaintEntity } from '../entities';
import { ComplaintStatus } from '../enums';

export abstract class BaseComplaintsService {
  protected constructor() {}

  protected ensureNotClosed(status: ComplaintStatus) {
    if (this.isTerminalStatus(status)) {
      throw new BadRequestException('You cannot edit a terminal complaint.');
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

  protected isLockActive(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return Date.now() < lockedUntil.getTime();
  }

  protected ensureLockAvailable(complaint: ComplaintEntity, internalUser: InternalUserEntity) {
    if (!complaint.lockedByInternalUserId) return true;

    if (
      complaint.lockedByInternalUserId === internalUser.id &&
      this.isLockActive(complaint.lockedUntil)
    ) {
      throw new BadRequestException('You already are locking this complaint.');
    }

    throw new BadRequestException('This complaint is locked by another staff member.');
  }

  protected ensureLockOwner(
    lockedById: number | null,
    lockedUntil: Date | null,
    currentStaffId: number,
  ) {
    if (!lockedById)
      throw new BadRequestException('You should lock the complaint before upadting it.');

    if (lockedById && lockedById !== currentStaffId && this.isLockActive(lockedUntil))
      throw new ConflictException('Complaint is locked by another staff member.');

    if (lockedById && lockedById === currentStaffId && !this.isLockActive(lockedUntil))
      throw new BadRequestException('Your lock was expired, please lock the complaint again.');
  }
}
