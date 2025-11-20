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
import {
  StaffComplaintFilterDto,
  UpdateComplaintStatusDto,
  UpdateComplaintContentDto,
  ComplaintResponseDto,
} from '../dtos';
import { StaffComplaintsService } from '../services/staff-your-bucket-name.service';

@Controller('staff/your-bucket-name')
@Protected(Role.STAFF)
export class StaffComplaintsController {
  constructor(private readonly staffComplaintsService: StaffComplaintsService) {}

  /**
   * استعراض شكاوى الجهة التابعة للموظف فقط.
   */
  @Get()
  async findAll(
    @CurrentUser() staff: InternalUserEntity,
    @Query() filterDto: StaffComplaintFilterDto,
  ): Promise<PaginationResponseDto<ComplaintResponseDto>> {
    const result = await this.staffComplaintsService.findAll(staff, filterDto);
    return {
      ...result,
      data: plainToInstance(ComplaintResponseDto, result.data),
    };
  }

  /**
   * مشاهدة شكوى واحدة ضمن جهة الموظف.
   */
  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  findOne(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.findOne(staff, id);
  }

  /**
   * قفل الشكوى لمنع التعديل المتوازي. fileciteturn4file0L112-L118
   */
  @Post(':id/lock')
  @SerializeResponse(ComplaintResponseDto)
  lock(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.lock(staff, id);
  }

  /**
   * فك القفل.
   */
  @Post(':id/unlock')
  @SerializeResponse(ComplaintResponseDto)
  unlock(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.unlock(staff, id);
  }

  /**
   * تعديل محتوى الشكوى (ينشئ history جديدة).
   */
  @Patch(':id/content')
  @SerializeResponse(ComplaintResponseDto)
  updateContent(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintContentDto,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.updateContent(staff, id, dto);
  }

  /**
   * تحديث حالة الشكوى (ينشئ history جديدة).
   */
  @Patch(':id/status')
  @SerializeResponse(ComplaintResponseDto)
  updateStatus(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintStatusDto,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.updateStatus(staff, id, dto);
  }
}
