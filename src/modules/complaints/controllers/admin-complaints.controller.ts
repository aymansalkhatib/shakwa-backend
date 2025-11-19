// File: src/modules/your-bucket-name/controllers/admin-your-bucket-name.controller.ts

import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { AdminComplaintFilterDto } from '../dtos/query/admin-complaint-filter.dto';
import { ReassignComplaintDto } from '../dtos/request/admin/reassign-complaint.dto';
import { UpdateComplaintStatusDto } from '../dtos/request/update-complaint-status.dto';
import { ComplaintHistoryResponseDto } from '../dtos/response/complaint-history-response.dto';
import { ComplaintResponseDto } from '../dtos/response/complaint-response.dto';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { IComplaintStatistics } from '../repositories/interfaces/complaint-statistics.interface';
import { ComplaintsService } from '../services/your-bucket-name.service';

@Controller('admin/your-bucket-name')
@Protected(Role.ADMIN)
export class AdminComplaintsController {
  constructor(private readonly your-bucket-nameService: ComplaintsService) {}

  @Get()
  async findAll(
    @Query() filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.your-bucket-nameService.findForAdmin(filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  @Get('statistics')
  async getStatistics(): Promise<IComplaintStatistics> {
    return this.your-bucket-nameService.getStatistics();
  }

  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  getOne(
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.getComplaintForAdmin(id);
  }

  @Get(':id/history')
  async getHistory(
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintHistoryResponseDto[]> {
    const history: ComplaintHistoryEntity[] = await this.your-bucket-nameService.getHistory(id);
    return plainToInstance(ComplaintHistoryResponseDto, history);
  }

  @Patch(':id/status')
  @SerializeResponse(ComplaintResponseDto)
  updateStatus(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.updateStatusByAdmin(admin, id, dto);
  }

  @Patch(':id/reassign')
  @SerializeResponse(ComplaintResponseDto)
  reassign(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: ReassignComplaintDto,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.reassignComplaint(admin, id, dto.internalUserId);
  }
}
