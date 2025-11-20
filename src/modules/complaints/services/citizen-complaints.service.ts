import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from '../constants/your-bucket-name.tokens';
import { CitizenComplaintFilterDto, CreateComplaintDto, UpdateMyComplaintDto } from '../dtos';
import { ComplaintEntity } from '../entities/complaint.entity';
import { ComplaintStatus } from '../enums';
import { IComplaintHistoryRepository } from '../repositories/complaint-history.repository.interface';
import {
  ComplaintWithLatestHistory,
  IComplaintsRepository,
} from '../repositories/your-bucket-name.repository.interface';

@Injectable()
export class CitizenComplaintsService {
  constructor(
    @Inject(COMPLAINTS_REPOSITORY_TOKEN)
    private readonly your-bucket-nameRepo: IComplaintsRepository,
    @Inject(COMPLAINT_HISTORY_REPOSITORY_TOKEN)
    private readonly historyRepo: IComplaintHistoryRepository,
  ) {}

  async create(citizen: CitizenEntity, dto: CreateComplaintDto): Promise<ComplaintEntity> {
    const complaint = await this.your-bucket-nameRepo.create({
      ...dto,
      citizenId: citizen.id,
    });

    const history = await this.historyRepo.addEntry({
      ...dto,
      complaintId: complaint.id,
      status: ComplaintStatus.NEW,
      note: 'Complaint created by citizen.',
    });
    complaint.histories = [history];

    return complaint;
  }

  async findAll(
    citizen: CitizenEntity,
    filterDto: CitizenComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintEntity>> {
    return await this.your-bucket-nameRepo.findAll({
      ...filterDto,
      citizenId: citizen.id,
    });
  }

  async findOne(citizen: CitizenEntity, id: number): Promise<ComplaintWithLatestHistory> {
    const complaint = await this.your-bucket-nameRepo.findById(id);
    if (!complaint || complaint.citizenId !== citizen.id) {
      throw new NotFoundException('Complaint not found');
    }
    return complaint;
  }

  async update(
    citizen: CitizenEntity,
    id: number,
    dto: UpdateMyComplaintDto,
  ): Promise<ComplaintWithLatestHistory> {
    const complaint = await this.findOne(citizen, id);
    const latest = complaint.latestHistory;
    const latestStatus = latest.status;

    if (complaint.lockedByInternalUserId) {
      throw new BadRequestException(
        'This complaint is currently being processed and cannot be edited.',
      );
    }

    if (!latest) {
      throw new BadRequestException('Complaint has no history to update.');
    }

    if (this.isTerminalStatus(latestStatus)) {
      throw new BadRequestException('You cannot edit a terminal complaint.');
    }

    const history = await this.historyRepo.addEntry({
      complaintId: complaint.id,
      internalUserId: null,
      title: dto.title ?? latest?.title ?? '',
      description: dto.description ?? latest?.description ?? '',
      status: latestStatus,
      location: dto.location ?? latest?.location ?? null,
      attachments: dto.attachments ?? latest?.attachments ?? [],
      note: 'Complaint updated by citizen.',
    });

    complaint.histories = [history];
    return complaint;
  }

  private isTerminalStatus(status: ComplaintStatus): boolean {
    return (
      status === ComplaintStatus.RESOLVED ||
      status === ComplaintStatus.REJECTED ||
      status === ComplaintStatus.CANCELLED ||
      status === ComplaintStatus.CLOSED
    );
  }
}
