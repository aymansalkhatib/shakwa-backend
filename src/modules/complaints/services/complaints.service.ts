// File: src/modules/your-bucket-name/services/your-bucket-name.service.ts

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InternalRoleToRoleMap, Role } from '../../../common/enums/role.enum';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { AdminComplaintFilterDto } from '../dtos/query/admin-complaint-filter.dto';
import { CitizenComplaintFilterDto } from '../dtos/query/citizen-complaint-filter.dto';
import { StaffComplaintFilterDto } from '../dtos/query/staff-complaint-filter.dto';
import { CreateComplaintDto } from '../dtos/request/citizen/create-complaint.dto';
import { UpdateComplaintStatusDto } from '../dtos/request/update-complaint-status.dto';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintCategory } from '../enums/complaint-category.enum';
import { ComplaintPriority } from '../enums/complaint-priority.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import {
  IComplaintHistoryRepository,
  ICreateComplaintHistoryData,
} from '../repositories/complaint-history.repository.interface';
import { IComplaintsRepository } from '../repositories/your-bucket-name.repository.interface';
import { IComplaintFilter, IComplaintStatistics } from '../repositories/interfaces';

@Injectable()
export class ComplaintsService {
  /**
   * Lock time-to-live in milliseconds.
   * After this period, another staff member can acquire the lock.
   */
  private readonly LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepository: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly complaintHistoryRepository: IComplaintHistoryRepository,
  ) {}

  // -----------------------------------------------------------------------
  // Citizen-facing operations
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

  // -----------------------------------------------------------------------
  // Staff-facing operations
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
    // In a more advanced model we would restrict staff visibility here
    // to your-bucket-name belonging to their authority or assignment.
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
      changedByRole: InternalRoleToRoleMap[staff.role],
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
      throw new ConflictException('Complaint is locked by another staff member.');
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
      changedByRole: InternalRoleToRoleMap[staff.role],
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
      changedByRole: InternalRoleToRoleMap[staff.role],
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

    // Auto-assign to current staff if not assigned
    if (!complaint.assignedToInternalUserId) {
      updateData.assignedToInternalUserId = staff.id;
    }

    const updated = await this.your-bucket-nameRepository.update(complaint, updateData);

    await this.addHistory({
      complaintId: complaint.id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      note: dto.note ?? null,
      changedByRole: InternalRoleToRoleMap[staff.role],
      changedByCitizenId: null,
      changedByInternalUserId: staff.id,
    });

    return updated;
  }

  // -----------------------------------------------------------------------
  // Admin-facing operations
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
      changedByRole: InternalRoleToRoleMap[admin.role],
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
      changedByRole: InternalRoleToRoleMap[admin.role],
      changedByCitizenId: null,
      changedByInternalUserId: admin.id,
    });

    return updated;
  }

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

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private generateReferenceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return 'CMP-' + year + month + day + '-' + randomPart;
  }

  private async addHistory(data: ICreateComplaintHistoryData): Promise<void> {
    await this.complaintHistoryRepository.addEntry(data);
  }

  private ensureNotClosed(complaint: ComplaintEntity): void {
    if (this.isTerminalStatus(complaint.status)) {
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

  private isLockActive(complaint: ComplaintEntity): boolean {
    if (!complaint.lockedAt) return false;
    const now = Date.now();
    return now - complaint.lockedAt.getTime() < this.LOCK_TTL_MS;
  }

  private ensureLockAvailable(complaint: ComplaintEntity, staff: InternalUserEntity): void {
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
}
