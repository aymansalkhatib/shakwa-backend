import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CITIZENS_REPOSITORY_TOKEN } from '../citizens.module';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';
import { ICitizensRepository } from '../repositories/citizens.repository.interface';

@Injectable()
export class CitizensService {
  constructor(
    @Inject(CITIZENS_REPOSITORY_TOKEN)
    private readonly citizensRepository: ICitizensRepository,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<CitizenEntity> {
    // Check if email already exists
    if (createCitizenDto.email) {
      const existingCitizen = await this.citizensRepository.findByEmail(createCitizenDto.email);
      if (existingCitizen) {
        throw new BadRequestException('Citizen with this email already exists');
      }
    }

    // Check if phone already exists
    if (createCitizenDto.phone) {
      const existingCitizen = await this.citizensRepository.findByPhone(createCitizenDto.phone);
      if (existingCitizen) {
        throw new BadRequestException('Citizen with this phone already exists');
      }
    }

    return await this.citizensRepository.create(createCitizenDto);
  }

  async findAll(
    filterCitizenDto: CitizenFilterDto,
  ): Promise<PaginationResponseDto<CitizenResponseDto>> {
    return await this.citizensRepository.findAll(filterCitizenDto);
  }

  async findOne(id: number): Promise<CitizenResponseDto> {
    const citizen = await this.citizensRepository.findOne(id);

    if (!citizen) {
      throw new NotFoundException('Citizen not found');
    }

    return citizen as CitizenResponseDto;
  }

  async update(id: number, updateCitizenDto: UpdateCitizenDto): Promise<CitizenEntity> {
    // Check if citizen exists
    const exists = await this.citizensRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('Citizen not found');
    }

    // Check if email is being updated and already exists
    if (updateCitizenDto.email) {
      const existingCitizen = await this.citizensRepository.findByEmail(updateCitizenDto.email);
      if (existingCitizen && existingCitizen.id !== id) {
        throw new BadRequestException('Citizen with this email already exists');
      }
    }

    // Check if phone is being updated and already exists
    if (updateCitizenDto.phone) {
      const existingCitizen = await this.citizensRepository.findByPhone(updateCitizenDto.phone);
      if (existingCitizen && existingCitizen.id !== id) {
        throw new BadRequestException('Citizen with this phone already exists');
      }
    }

    return await this.citizensRepository.update(id, updateCitizenDto);
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.citizensRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException('Citizen not found');
    }
  }
}
