// File: src/modules/your-bucket-name/services/staff-your-bucket-name.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { StaffComplaintFilterDto } from '../dtos/query/staff-complaint-filter.dto';
import { UpdateComplaintStatusDto } from '../dtos/request/update-complaint-status.dto';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { IComplaintFilter } from '../repositories/interfaces';
import { BaseComplaintsService } from './base-your-bucket-name.service';

@Injectable()
export class StaffComplaintsService extends BaseComplaintsService {
  // -----------------------------------------------------------------------
  // عمليات الموظف (Staff-facing)
  // -----------------------------------------------------------------------

  async findForStaff(
    staff: InternalUserEntity,
    filterDto: StaffComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    const filter: IComplaintFilter = {
      ...filterDto,
      staffId: staff.id,
      includeUnassignedForStaff:
        typeof filterDto.includeUnassigned === 'boolean' ? filterDto.includeUnassigned : true,
    };
    return await this.your-bucket-nameRepository.findAll(filter);
  }

  async getComplaintForStaff(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    // يمكن لاحقاً تقييد رؤية الموظف بحسب الجهة أو الصلاحيات
    return complaint;
  }

  async lockComplaintForStaff(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForStaff(staff, id);
    this.ensureNotClosed(complaint);
    this.ensureLockAvailable(complaint, staff);

    const updated = await this.your-bucket-nameRepository.update(complaint, {
      lockedByInternalUserId: staff.id,
      lockedAt: new Date(),
    });

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      note: 'Complaint locked by staff member.',
      changedByRole: this.mapInternalRoleToRole(staff),
      changedByCitizenId: null,
      changedByInternalUserId: staff.id,
    });

    return updated;
  }

  async unlockComplaintForStaff(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForStaff(staff, id);
    this.ensureNotClosed(complaint);

    if (
      complaint.lockedByInternalUserId &&
      complaint.lockedByInternalUserId !== staff.id &&
      this.isLockActive(complaint)
    ) {
      throw new BadRequestException('Complaint is locked by another staff member.');
    }

    const updated = await this.your-bucket-nameRepository.update(complaint, {
      lockedByInternalUserId: null,
      lockedAt: null,
    });

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      note: 'Complaint unlocked by staff member.',
      changedByRole: this.mapInternalRoleToRole(staff),
      changedByCitizenId: null,
      changedByInternalUserId: staff.id,
    });

    return updated;
  }

  async assignToCurrentStaff(staff: InternalUserEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForStaff(staff, id);
    this.ensureNotClosed(complaint);

    if (complaint.assignedToInternalUserId && complaint.assignedToInternalUserId !== staff.id) {
      throw new BadRequestException('Complaint is already assigned to another staff member.');
    }

    const updated = await this.your-bucket-nameRepository.update(complaint, {
      assignedToInternalUserId: staff.id,
    });

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      note: 'Complaint assigned to staff member.',
      changedByRole: this.mapInternalRoleToRole(staff),
      changedByCitizenId: null,
      changedByInternalUserId: staff.id,
    });

    return updated;
  }

  async updateStatusByStaff(
    staff: InternalUserEntity,
    id: number,
    dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForStaff(staff, id);
    this.ensureNotClosed(complaint);
    this.ensureLockAvailable(complaint, staff);

    const previousStatus = complaint.status;
    const newStatus = dto.status;

    if (previousStatus === ComplaintStatus.CANCELLED) {
      throw new BadRequestException('Cancelled your-bucket-name cannot be updated.');
    }

    const updateData: Partial<ComplaintEntity> = {
      status: newStatus,
    };

    if (this.isTerminalStatus(newStatus)) {
      updateData.closedAt = new Date();
    }

    // تعيين تلقائي للموظف الحالي إذا لم تكن الشكوى مخصصة
    if (!complaint.assignedToInternalUserId) {
      updateData.assignedToInternalUserId = staff.id;
    }

    const updated = await this.your-bucket-nameRepository.update(complaint, updateData);

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      note: dto.note ?? null,
      changedByRole: this.mapInternalRoleToRole(staff),
      changedByCitizenId: null,
      changedByInternalUserId: staff.id,
    });

    return updated;
  }
}
