import { SignedUrlInterceptor } from '@app/shared/services/storage/interceptors/signed-url.interceptor';
import { Body, Controller, Get, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { AdminComplaintFilterDto, ComplaintResponseDto, UpdateComplaintContentDto } from '../dtos';
import { ComplaintStatisticsDto } from '../dtos/response/complaint-statistics.dto';
import { AdminComplaintsService } from '../services/admin-your-bucket-name.service';

@Controller('admin/your-bucket-name')
@Protected(Role.ADMIN)
@UseInterceptors(SignedUrlInterceptor)
export class AdminComplaintsController {
  constructor(private readonly adminComplaintsService: AdminComplaintsService) {}

  @Get('statistics')
  async getStatistics(): Promise<ComplaintStatisticsDto> {
    return this.adminComplaintsService.getStatistics();
  }

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

  @Get(':id')
  @SerializeResponse(ComplaintResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.findOne(id);
  }

  @Patch(':id/content')
  @SerializeResponse(ComplaintResponseDto)
  updateContent(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
    @Body() dto: UpdateComplaintContentDto,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.updateContent(admin, id, dto);
  }

  @Patch(':id/lock')
  @SerializeResponse(ComplaintResponseDto)
  lockComplaint(
    @CurrentUser() admin: InternalUserEntity,
    @Param('id', PositiveIntPipe) id: number,
  ): Promise<ComplaintResponseDto> {
    return this.adminComplaintsService.lockComplaint(admin, id);
  }
}
