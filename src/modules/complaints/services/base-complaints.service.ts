import { BadRequestException, ConflictException } from '@nestjs/common';
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

  protected ensureLockAvailable(
    lockedById: number | null,
    lockedAt: Date | null,
    currentStaffId: number,
  ) {
    if (lockedById && lockedById !== currentStaffId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another staff member.');
    }
  }

  protected ensureLockOwnerOrExpired(
    lockedById: number | null,
    lockedAt: Date | null,
    currentStaffId: number,
  ) {
    if (lockedById && lockedById !== currentStaffId && this.isLockActive(lockedAt)) {
      throw new ConflictException('Complaint is locked by another staff member.');
    }
  }
}
