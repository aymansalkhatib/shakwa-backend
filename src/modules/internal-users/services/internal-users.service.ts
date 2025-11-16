import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InternalRole } from '../../../common/enums/role.enum';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { INTERNAL_USERS_REPOSITORY_TOKEN } from '../constants/internal-users.tokens';
import { InternalUserFilterDto } from '../dtos/query/internal-user-filter.dto';
import { CreateInternalUserDto } from '../dtos/request/create-internal-user.dto';
import { UpdateInternalUserDto } from '../dtos/request/update-internal-user.dto';
import { InternalUserEntity } from '../entities/internal-user.entity';
import { IInternalUsersRepository } from '../repositories/internal-users.repository.interface';

@Injectable()
export class InternalUsersService {
  constructor(
    @Inject(INTERNAL_USERS_REPOSITORY_TOKEN)
    private readonly internalUsersRepository: IInternalUsersRepository,
  ) {}

  async create(createInternalUserDto: CreateInternalUserDto): Promise<InternalUserEntity> {
    // Check if email already exists
    const existingInternalUser = await this.internalUsersRepository.findByEmail(
      createInternalUserDto.email,
    );
    if (existingInternalUser) {
      throw new ConflictException('Internal user with this email already exists');
    }

    return await this.internalUsersRepository.create({
      ...createInternalUserDto,
      role: InternalRole.STAFF,
    });
  }

  async findAll(
    filterInternalUserDto: InternalUserFilterDto,
  ): Promise<PaginationResponseDto<InternalUserEntity>> {
    return await this.internalUsersRepository.findAll(filterInternalUserDto);
  }

  async findOne(id: number): Promise<InternalUserEntity> {
    const internalUser = await this.internalUsersRepository.findOne(id);

    if (!internalUser) {
      throw new NotFoundException('Internal user not found');
    }

    return internalUser;
  }

  async updateMyAccount(
    internalUser: InternalUserEntity,
    updateInternalUserDto: UpdateInternalUserDto,
  ): Promise<InternalUserEntity> {
    return await this.internalUsersRepository.update(internalUser, updateInternalUserDto);
  }

  async deleteMyAccount(id: number): Promise<void> {
    const deleted = await this.internalUsersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Internal user not found');
    }
  }

  async updateAccountBySuperUser(
    id: number,
    updateInternalUserDto: UpdateInternalUserDto,
  ): Promise<InternalUserEntity> {
    const internalUser = await this.internalUsersRepository.findOne(id);
    if (!internalUser) {
      throw new NotFoundException('Internal user not found');
    }

    if (internalUser.role !== InternalRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to update an ADMIN user');
    }

    return await this.internalUsersRepository.update(internalUser, updateInternalUserDto);
  }

  async deleteAccountBySuperUser(id: number): Promise<void> {
    const internalUser = await this.internalUsersRepository.findOne(id);
    if (!internalUser) {
      throw new NotFoundException('Internal user not found');
    }

    if (internalUser.role !== InternalRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to delete an ADMIN user');
    }
    await this.internalUsersRepository.delete(internalUser.id);
  }
}
