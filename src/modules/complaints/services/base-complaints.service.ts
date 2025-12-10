import { BadRequestException, ConflictException } from '@nestjs/common';
import { ComplaintStatus } from '../enums';
import { ComplaintLockerRole } from '../enums/complaint-locker-role.enum';

export abstract class BaseComplaintsService {
  protected constructor() {}

  protected ensureNotTerminal(status: ComplaintStatus) {
    if (this.isTerminalStatus(status)) {
      throw new BadRequestException(
        'Cannot edit a complaint in terminal status (RESOLVED, REJECTED, or CANCELLED).',
      );
    }
  }

  protected isTerminalStatus(status: ComplaintStatus): boolean {
    return (
      status === ComplaintStatus.RESOLVED ||
      status === ComplaintStatus.REJECTED ||
      status === ComplaintStatus.CANCELLED
    );
  }

  protected validateStatusTransition(from: ComplaintStatus, to: ComplaintStatus) {
    // If status is not changing, allow it
    if (from === to) return;

    // Define valid transitions
    const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      [ComplaintStatus.NEW]: [
        ComplaintStatus.IN_REVIEW,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.NEED_MORE_INFO,
        ComplaintStatus.REJECTED,
        ComplaintStatus.CANCELLED,
      ],
      [ComplaintStatus.IN_REVIEW]: [
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.NEED_MORE_INFO,
        ComplaintStatus.REJECTED,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.CANCELLED,
      ],
      [ComplaintStatus.IN_PROGRESS]: [
        ComplaintStatus.NEED_MORE_INFO,
        ComplaintStatus.RESOLVED,
        ComplaintStatus.REJECTED,
        ComplaintStatus.CANCELLED,
      ],
      [ComplaintStatus.NEED_MORE_INFO]: [
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.IN_REVIEW,
        ComplaintStatus.REJECTED,
        ComplaintStatus.CANCELLED,
      ],
      [ComplaintStatus.RESOLVED]: [],
      [ComplaintStatus.REJECTED]: [],
      [ComplaintStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[from] || [];
    if (!allowedTransitions.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}.`,
      );
    }
  }

  protected isLockActive(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return Date.now() < lockedUntil.getTime();
  }

  protected ensureLockOwner(
    complaint: {
      lockedById: number | null;
      lockedByRole: ComplaintLockerRole | null;
      lockedUntil: Date | null;
    },
    currentUserId: number,
    currentUserRole: ComplaintLockerRole,
  ) {
    // 1. If locked by someone else (different ID or different Role) AND lock is active
    if (
      (complaint.lockedById !== currentUserId || complaint.lockedByRole !== currentUserRole) &&
      this.isLockActive(complaint.lockedUntil)
    ) {
      throw new ConflictException('Complaint is locked by another user.');
    }

    // 2. If locked by current user but expired
    if (
      complaint.lockedById === currentUserId &&
      complaint.lockedByRole === currentUserRole &&
      !this.isLockActive(complaint.lockedUntil)
    ) {
      throw new BadRequestException('Your lock has expired, please lock the complaint again.');
    }

    // 3. If not locked (no ID/Role OR expired and not caught by above)
    if (
      !complaint.lockedById ||
      !complaint.lockedByRole ||
      !this.isLockActive(complaint.lockedUntil)
    ) {
      throw new BadRequestException('You should lock the complaint before updating it.');
    }
  }
}
