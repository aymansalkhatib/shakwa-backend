// File: src/modules/your-bucket-name/controllers/citizen-your-bucket-name.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { CitizenComplaintFilterDto } from '../dtos/query/citizen-complaint-filter.dto';
import { CreateComplaintDto } from '../dtos/request/citizen/create-complaint.dto';
import { ComplaintHistoryResponseDto } from '../dtos/response/complaint-history-response.dto';
import { ComplaintResponseDto } from '../dtos/response/complaint-response.dto';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';
import { CitizensComplaintsService } from '../services/citizens-your-bucket-name.service';

@Controller('citizens/your-bucket-name')
@Protected(Role.CITIZEN)
export class CitizenComplaintsController {
  constructor(private readonly your-bucket-nameService: CitizensComplaintsService) {}

  @Post()
  @SerializeResponse(ComplaintResponseDto)
  create(
    @CurrentUser() citizen: CitizenEntity,
    @Body() dto: CreateComplaintDto,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.createForCitizen(citizen, dto);
  }

  @Get()
  async findMyComplaints(
    @CurrentUser() citizen: CitizenEntity,
    @Query() filterDto: CitizenComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.your-bucket-nameService.findForCitizen(citizen, filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  getOne(
    @CurrentUser() citizen: CitizenEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.getCitizenComplaint(citizen, id);
  }

  @Patch(':id/cancel')
  @SerializeResponse(ComplaintResponseDto)
  cancel(
    @CurrentUser() citizen: CitizenEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.your-bucket-nameService.cancelCitizenComplaint(citizen, id);
  }

  @Get(':id/history')
  async getHistory(
    @CurrentUser() citizen: CitizenEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintHistoryResponseDto[]> {
    // Re-use citizen access check by first loading the complaint
    await this.your-bucket-nameService.getCitizenComplaint(citizen, id);
    const history: ComplaintHistoryEntity[] = await this.your-bucket-nameService.getHistory(id);
    return plainToInstance(ComplaintHistoryResponseDto, history);
  }
}
