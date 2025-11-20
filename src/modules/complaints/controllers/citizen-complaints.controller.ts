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
import {
  CitizenComplaintFilterDto,
  CreateComplaintDto,
  UpdateMyComplaintDto,
  ComplaintResponseDto,
} from '../dtos';
import { CitizenComplaintsService } from '../services/citizen-your-bucket-name.service';

@Controller('citizen/your-bucket-name')
@Protected(Role.CITIZEN)
export class CitizenComplaintsController {
  constructor(private readonly citizenComplaintsService: CitizenComplaintsService) {}

  /**
   * إنشاء شكوى جديدة من المواطن.
   */
  @Post()
  @SerializeResponse(ComplaintResponseDto)
  create(
    @CurrentUser() citizen: CitizenEntity,
    @Body() dto: CreateComplaintDto,
  ): Promise<ComplaintResponseDto> {
    return this.citizenComplaintsService.create(citizen, dto);
  }

  /**
   * استعراض شكاوى المواطن مع Pagination.
   */
  @Get()
  async findAll(
    @CurrentUser() citizen: CitizenEntity,
    @Query() filterDto: CitizenComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.citizenComplaintsService.findAll(citizen, filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  /**
   * مشاهدة شكوى واحدة (يجب أن تكون تابعة للمواطن نفسه).
   */
  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  findOne(
    @CurrentUser() citizen: CitizenEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.citizenComplaintsService.findOne(citizen, id);
  }

  /**
   * تعديل شكوى المواطن قبل انتهاء المعالجة.
   */
  @Patch(':id')
  @SerializeResponse(ComplaintResponseDto)
  update(
    @CurrentUser() citizen: CitizenEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateMyComplaintDto,
  ): Promise<ComplaintResponseDto> {
    return this.citizenComplaintsService.update(citizen, id, dto);
  }
}
