import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CITIZENS_REPOSITORY_TOKEN } from '../constants/citizens.tokens';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CitizenEntity } from '../entities/citizen.entity';
import { ICitizensRepository } from '../repositories/citizens.repository.interface';

@Injectable()
export class CitizensAdminService {
  constructor(
    @Inject(CITIZENS_REPOSITORY_TOKEN)
    private readonly citizensRepository: ICitizensRepository,
  ) {}

  async findAll(filterCitizenDto: CitizenFilterDto): Promise<PaginationResponseDto<CitizenEntity>> {
    return await this.citizensRepository.findAll(filterCitizenDto);
  }

  async findOneOrFail(id: number): Promise<CitizenEntity> {
    const citizen = await this.citizensRepository.findOne(id);

    if (!citizen) {
      throw new NotFoundException('Citizen not found');
    }

    return citizen;
  }

  async findOne(id: number): Promise<CitizenEntity | null> {
    const citizen = await this.citizensRepository.findOne(id);
    return citizen;
  }

  async blockCitizen(id: number): Promise<CitizenEntity> {
    const citizen = await this.findOneOrFail(id);

    if (citizen.blockedAt) {
      throw new ConflictException('Citizen is already blocked');
    }

    const updatedCitizen = await this.citizensRepository.update(citizen, {
      blockedAt: new Date(),
    });

    return updatedCitizen;
  }

  async unblockCitizen(id: number): Promise<CitizenEntity> {
    const citizen = await this.findOneOrFail(id);

    if (!citizen.blockedAt) {
      throw new ConflictException('Citizen is not blocked');
    }

    const updatedCitizen = await this.citizensRepository.update(citizen, {
      blockedAt: null,
    });

    return updatedCitizen;
  }
}
