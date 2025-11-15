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
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizensService } from '../services/citizens.service';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  @SerializeResponse(CitizenResponseDto)
  async create(@Body() createCitizenDto: CreateCitizenDto): Promise<CitizenResponseDto> {
    const citizen = await this.citizensService.create(createCitizenDto);
    return citizen as CitizenResponseDto;
  }

  @Get()
  findAll(
    @Query() filterCitizenDto: CitizenFilterDto,
  ): Promise<PaginationResponseDto<CitizenResponseDto>> {
    return this.citizensService.findAll(filterCitizenDto);
  }

  @Get(':id')
  @SerializeResponse(CitizenResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<CitizenResponseDto> {
    return this.citizensService.findOne(id);
  }

  @Patch(':id')
  @SerializeResponse(CitizenResponseDto)
  async update(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateCitizenDto: UpdateCitizenDto,
  ): Promise<CitizenResponseDto> {
    const citizen = await this.citizensService.update(id, updateCitizenDto);
    return citizen as CitizenResponseDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    this.citizensService.delete(id);
  }
}
