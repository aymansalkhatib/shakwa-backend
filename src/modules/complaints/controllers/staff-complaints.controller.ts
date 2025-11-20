// File: src/modules/your-bucket-name/controllers/staff-your-bucket-name.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { StaffComplaintFilterDto } from '../dtos/query/staff-complaint-filter.dto';
import { UpdateComplaintStatusDto } from '../dtos/request/update-complaint-status.dto';
import { ComplaintHistoryResponseDto } from '../dtos/response/complaint-history-response.dto';
import { ComplaintResponseDto } from '../dtos/response/complaint-response.dto';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { StaffComplaintsService } from '../services/staff-your-bucket-name.service';

@Controller('staff/your-bucket-name')
@Protected(Role.STAFF)
export class StaffComplaintsController {
  constructor(private readonly your-bucket-nameService: StaffComplaintsService) {}

  @Get()
  async findAllForStaff(
    @CurrentUser() staff: InternalUserEntity,
    @Query() filterDto: StaffComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.your-bucket-nameService.findForStaff(staff, filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  getOne(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.getComplaintForStaff(staff, id);
  }

  @Post(':id/lock')
  @SerializeResponse(ComplaintResponseDto)
  lockComplaint(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.lockComplaintForStaff(staff, id);
  }

  @Post(':id/unlock')
  @SerializeResponse(ComplaintResponseDto)
  unlockComplaint(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.unlockComplaintForStaff(staff, id);
  }

  @Patch(':id/assign-me')
  @SerializeResponse(ComplaintResponseDto)
  assignToMe(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.assignToCurrentStaff(staff, id);
  }

  @Patch(':id/status')
  @SerializeResponse(ComplaintResponseDto)
  updateStatus(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.updateStatusByStaff(staff, id, dto);
  }

  @Get(':id/history')
  async getHistory(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintHistoryResponseDto[]> {
    // Ensure complaint exists and staff can view it
    await this.your-bucket-nameService.getComplaintForStaff(staff, id);
    const history: ComplaintHistoryEntity[] = await this.your-bucket-nameService.getHistory(id);
    return plainToInstance(ComplaintHistoryResponseDto, history);
  }
}
