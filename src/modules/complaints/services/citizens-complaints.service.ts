// File: src/modules/your-bucket-name/services/citizens-your-bucket-name.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { CitizenComplaintFilterDto } from '../dtos/query/citizen-complaint-filter.dto';
import { CreateComplaintDto } from '../dtos/request/citizen/create-complaint.dto';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintCategory } from '../enums/complaint-category.enum';
import { ComplaintPriority } from '../enums/complaint-priority.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { IComplaintFilter } from '../repositories/interfaces';
import { BaseComplaintsService } from './base-your-bucket-name.service';

@Injectable()
export class CitizensComplaintsService extends BaseComplaintsService {
  // -----------------------------------------------------------------------
  // عمليات المواطن (Citizen-facing)
  // -----------------------------------------------------------------------

  async createForCitizen(
    citizen: CitizenEntity,
    dto: CreateComplaintDto,
  ): Promise<ComplaintEntity> {
    const referenceNumber = this.generateReferenceNumber();

    const complaint = await this.your-bucket-nameRepository.create({
      referenceNumber,
      title: dto.title,
      description: dto.description,
      status: ComplaintStatus.NEW,
      priority: dto.priority ?? ComplaintPriority.MEDIUM,
      category: dto.category ?? ComplaintCategory.GENERAL_SERVICE,
      authority: dto.authority,
      locationText: dto.locationText ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      attachments: dto.attachments ?? [],
      citizenId: citizen.id,
      assignedToInternalUserId: null,
      lockedByInternalUserId: null,
      lockedAt: null,
      closedAt: null,
    });

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: null,
      toStatus: ComplaintStatus.NEW,
      note: 'Complaint created by citizen.',
      changedByRole: Role.CITIZEN,
      changedByCitizenId: citizen.id,
      changedByInternalUserId: null,
    });

    return complaint;
  }

  async findForCitizen(
    citizen: CitizenEntity,
    filterDto: CitizenComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    const filter: IComplaintFilter = {
      ...filterDto,
      citizenId: citizen.id,
    };
    return await this.your-bucket-nameRepository.findAll(filter);
  }

  async getCitizenComplaint(citizen: CitizenEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepository.findById(id);
    if (!complaint || complaint.citizenId !== citizen.id) {
      throw new NotFoundException('Complaint not found');
    }
    return complaint;
  }

  async cancelCitizenComplaint(citizen: CitizenEntity, id: number): Promise<ComplaintEntity> {
    const complaint = await this.getCitizenComplaint(citizen, id);

    if (
      complaint.status !== ComplaintStatus.NEW &&
      complaint.status !== ComplaintStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        'You can only cancel your-bucket-name that are still new or under review.',
      );
    }

    const previousStatus = complaint.status;
    const closedAt = new Date();

    const updated = await this.your-bucket-nameRepository.update(complaint, {
      status: ComplaintStatus.CANCELLED,
      closedAt,
    });

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: previousStatus,
      toStatus: ComplaintStatus.CANCELLED,
      note: 'Complaint cancelled by citizen.',
      changedByRole: Role.CITIZEN,
      changedByCitizenId: citizen.id,
      changedByInternalUserId: null,
    });

    return updated;
  }
}
