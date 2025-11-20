// File: src/modules/your-bucket-name/services/admin-your-bucket-name.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { AdminComplaintFilterDto } from '../dtos/query/admin-complaint-filter.dto';
import { UpdateComplaintStatusDto } from '../dtos/request/update-complaint-status.dto';
import { ComplaintEntity } from '../entities/complaint.entity';
import { IComplaintFilter } from '../repositories/interfaces';
import { BaseComplaintsService } from './base-your-bucket-name.service';

@Injectable()
export class AdminComplaintsService extends BaseComplaintsService {
  // -----------------------------------------------------------------------
  // عمليات المشرف / الـ Admin
  // -----------------------------------------------------------------------

  async findForAdmin(
    filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    const filter: IComplaintFilter = {
      ...filterDto,
      citizenId: filterDto.citizenId,
      assignedToInternalUserId: filterDto.assignedToInternalUserId,
    };

    return await this.your-bucket-nameRepository.findAll(filter);
  }

  async getComplaintForAdmin(id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepository.findById(id);
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    return complaint;
  }

  async updateStatusByAdmin(
    admin: InternalUserEntity,
    id: number,
    dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForAdmin(id);

    const previousStatus = complaint.status;
    const newStatus = dto.status;

    const updateData: Partial<ComplaintEntity> = {
      status: newStatus,
    };

    if (this.isTerminalStatus(newStatus)) {
      updateData.closedAt = new Date();
    }

    const updated = await this.your-bucket-nameRepository.update(complaint, updateData);

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      note: dto.note ?? null,
      changedByRole: this.mapInternalRoleToRole(admin),
      changedByCitizenId: null,
      changedByInternalUserId: admin.id,
    });

    return updated;
  }

  async reassignComplaint(
    admin: InternalUserEntity,
    id: number,
    internalUserId?: number,
  ): Promise<ComplaintEntity> {
    const complaint = await this.getComplaintForAdmin(id);

    const updated = await this.your-bucket-nameRepository.update(complaint, {
      assignedToInternalUserId: internalUserId ?? null,
    });

    const note = internalUserId
      ? `Complaint reassigned to internal user with id ${internalUserId}.`
      : 'Complaint unassigned by admin.';

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      note,
      changedByRole: this.mapInternalRoleToRole(admin),
      changedByCitizenId: null,
      changedByInternalUserId: admin.id,
    });

    return updated;
  }

  // ملاحظة: getStatistics و getHistory موروثتان من ComplaintsBaseService
}
