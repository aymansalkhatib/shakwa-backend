import { BadRequestException, ConflictException } from '@nestjs/common';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { ComplaintEntity } from '../entities';
import { ComplaintStatus } from '../enums';

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
