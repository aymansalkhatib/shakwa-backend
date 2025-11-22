import { Body, Controller, Get, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { SignedUrlInterceptor } from '../../../shared/services/storage/interceptors/signed-url.interceptor';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { ComplaintResponseDto, StaffComplaintFilterDto, UpdateComplaintStaffDto } from '../dtos';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { StaffComplaintsService } from '../services/staff-your-bucket-name.service';

@Controller('staff/your-bucket-name')
@Protected(Role.STAFF)
@UseInterceptors(SignedUrlInterceptor, CacheInterceptor)
export class StaffComplaintsController {
  constructor(private readonly staffComplaintsService: StaffComplaintsService) {}

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

  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  findOne(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.findOne(staff, id);
  }

  @Patch(':id')
  @SerializeResponse(ComplaintResponseDto)
  updateComplaint(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintStaffDto,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.updateComplaint(staff, id, dto);
  }

  @Patch(':id/lock')
  @SerializeResponse(ComplaintResponseDto)
  lockComplaint(
    @CurrentUser() staff: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.staffComplaintsService.lockComplaint(staff, id);
  }
}
