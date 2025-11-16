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
import { CurrentUser } from '../../../common/guards/current-user.decorator';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { PositiveIntPipe } from '../../../common/pipes/positive-int.pipe';
import { InternalUserFilterDto } from '../dtos/query/internal-user-filter.dto';
import { CreateInternalUserDto } from '../dtos/request/create-internal-user.dto';
import { UpdateInternalUserDto } from '../dtos/request/update-internal-user.dto';
import { InternalUserResponseDto } from '../dtos/response/internal-user-response.dto';
import { InternalUserEntity } from '../entities/internal-user.entity';
import { InternalUsersService } from '../services/internal-users.service';

@Controller('internal-users')
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Post()
  @Protected(Role.ADMIN)
  @SerializeResponse(InternalUserResponseDto)
  create(@Body() createInternalUserDto: CreateInternalUserDto): Promise<InternalUserResponseDto> {
    return this.internalUsersService.create(createInternalUserDto);
  }

  @Patch('me')
  @Protected(Role.ADMIN, Role.STAFF)
  @SerializeResponse(InternalUserResponseDto)
  updateMyAccount(
    @CurrentUser() internalUser: InternalUserEntity,
    @Body() updateInternalUserDto: UpdateInternalUserDto,
  ): Promise<InternalUserResponseDto> {
    return this.internalUsersService.updateMyAccount(internalUser, updateInternalUserDto);
  }

  @Delete('me')
  @Protected(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(@CurrentUser() internalUser: InternalUserEntity): Promise<void> {
    await this.internalUsersService.deleteMyAccount(internalUser.id);
  }

  @Patch(':id')
  @Protected(Role.ADMIN)
  @SerializeResponse(InternalUserResponseDto)
  updateAccountBySuperUser(
    @Param('id', PositiveIntPipe) id: number,
    @Body() updateInternalUserDto: UpdateInternalUserDto,
  ): Promise<InternalUserResponseDto> {
    return this.internalUsersService.updateAccountBySuperUser(id, updateInternalUserDto);
  }

  @Delete(':id')
  @Protected(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccountBySuperUser(@Param('id', PositiveIntPipe) id: number): Promise<void> {
    await this.internalUsersService.deleteAccountBySuperUser(id);
  }

  @Get('me')
  @Protected(Role.ADMIN, Role.STAFF)
  @SerializeResponse(InternalUserResponseDto)
  async getMe(@CurrentUser() internalUser: InternalUserEntity): Promise<InternalUserResponseDto> {
    return internalUser;
  }

  @Get(':id')
  @Protected(Role.ADMIN)
  @SerializeResponse(InternalUserResponseDto)
  findOne(@Param('id', PositiveIntPipe) id: number): Promise<InternalUserResponseDto> {
    return this.internalUsersService.findOne(id);
  }

  @Get()
  @Protected(Role.ADMIN)
  async findAll(
    @Query() filterInternalUserDto: InternalUserFilterDto,
  ): Promise<PaginationResponseDto<InternalUserResponseDto>> {
    const result = await this.internalUsersService.findAll(filterInternalUserDto);
    return {
      ...result,
      data: plainToInstance(InternalUserResponseDto, result.data),
    };
  }
}
