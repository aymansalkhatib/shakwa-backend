import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizensAdminService } from '../services/citizens-admin.service';

@Controller('admin/citizens')
@Protected(Role.ADMIN, Role.STAFF)
export class CitizensAdminController {
  constructor(private readonly citizensAdminService: CitizensAdminService) {}

  @Get()
  async findAll(
    @Query() filterCitizenDto: CitizenFilterDto,
  ): Promise<PaginationResponseDto<CitizenResponseDto>> {
    const result = await this.citizensAdminService.findAll(filterCitizenDto);
    return {
      ...result,
      data: plainToInstance(CitizenResponseDto, result.data),
    };
  }

  @Get(':id')
  @SerializeResponse(CitizenResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<CitizenResponseDto> {
    return this.citizensAdminService.findOne(id);
  }

  @Patch(':id')
  @SerializeResponse(CitizenResponseDto)
  update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateCitizenDto: UpdateCitizenDto,
  ): Promise<CitizenResponseDto> {
    return this.citizensAdminService.update(id, updateCitizenDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    await this.citizensAdminService.delete(id);
  }

  @Post(':id/block')
  @SerializeResponse(CitizenResponseDto)
  blockCitizen(@Param('id', PositiveIntPipe) id: number): Promise<CitizenResponseDto> {
    return this.citizensAdminService.blockCitizen(id);
  }

  @Post(':id/unblock')
  @SerializeResponse(CitizenResponseDto)
  unblockCitizen(@Param('id', PositiveIntPipe) id: number): Promise<CitizenResponseDto> {
    return this.citizensAdminService.unblockCitizen(id);
  }
}
