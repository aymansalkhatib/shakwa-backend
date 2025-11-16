import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';
import { CitizensService } from '../services/citizens.service';

@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Post()
  @SerializeResponse(CitizenResponseDto)
  create(@Body() createCitizenDto: CreateCitizenDto): Promise<CitizenResponseDto> {
    return this.citizensService.create(createCitizenDto);
  }

  @Patch('me')
  @SerializeResponse(CitizenResponseDto)
  updateMyAccount(
    @CurrentUser() citizen: CitizenEntity,
    @Body() updateCitizenDto: UpdateCitizenDto,
  ): Promise<CitizenResponseDto> {
    return this.citizensService.updateMyAccount(citizen, updateCitizenDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(@CurrentUser() citizen: CitizenEntity): Promise<void> {
    await this.citizensService.deleteMyAccount(citizen.id);
  }
}
