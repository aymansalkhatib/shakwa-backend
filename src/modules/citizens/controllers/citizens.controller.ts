import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { Protected } from '../../../common/decorators/protected.decorator';
import { SerializeResponse } from '../../../common/decorators/serialize-response.decorator';
import { Role } from '../../../common/enums/role.enum';
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';
import { CitizensService } from '../services/citizens.service';

@Controller('citizens')
@Protected(Role.CITIZEN)
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get('me')
  @SerializeResponse(CitizenResponseDto)
  getMe(@CurrentUser() citizen: CitizenEntity): CitizenEntity {
    return citizen;
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
