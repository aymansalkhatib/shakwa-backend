// File: src/modules/your-bucket-name/controllers/admin-your-bucket-name.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import {
  AdminComplaintFilterDto,
  UpdateComplaintStatusDto,
  UpdateComplaintContentDto,
  UpdateComplaintBaseDto,
  ComplaintResponseDto,
  ComplaintHistoryResponseDto,
} from '../dtos';
import { AdminComplaintsService } from '../services/admin-your-bucket-name.service';

@Controller('admin/your-bucket-name')
@Protected(Role.ADMIN)
export class AdminComplaintsController {
  constructor(private readonly adminComplaintsService: AdminComplaintsService) {}

  /**
   * استعراض كل الشكاوى مع Pagination وفلاتر.
   */
  @Get()
  async findAll(
    @Query() filterDto: AdminComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.adminComplaintsService.findAll(filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  /**
   * مشاهدة شكوى واحدة.
   */
  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.findOne(id);
  }

  /**
   * مشاهدة history الشكوى.
   */
  @Get(':id/history')
  @SerializeResponse(ComplaintHistoryResponseDto)
  async getHistory(
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintHistoryResponseDto[]> {
    return this.adminComplaintsService.getHistory(id);
  }

  /**
   * قفل الشكوى.
   */
  @Post(':id/lock')
  @SerializeResponse(ComplaintResponseDto)
  lock(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.lock(admin, id);
  }

  /**
   * فك القفل.
   */
  @Post(':id/unlock')
  @SerializeResponse(ComplaintResponseDto)
  unlock(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.unlock(admin, id);
  }

  /**
   * تعديل محتوى الشكوى.
   */
  @Patch(':id/content')
  @SerializeResponse(ComplaintResponseDto)
  updateContent(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintContentDto,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.updateContent(admin, id, dto);
  }

  /**
   * تعديل الحالة.
   */
  @Patch(':id/status')
  @SerializeResponse(ComplaintResponseDto)
  updateStatus(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.updateStatus(admin, id, dto);
  }

  /**
   * تعديل الحقول الأساسية (category/authority) في جدول your-bucket-name.
   */
  @Patch(':id/base')
  @SerializeResponse(ComplaintResponseDto)
  updateBase(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintBaseDto,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.updateBase(admin, id, dto);
  }

  /**
   * إحصائيات عامة (للأدمن فقط). fileciteturn4file0L100-L106
   */
  @Get('stats/overview')
  async getStatistics() {
    return this.adminComplaintsService.getStatistics();
  }
}
