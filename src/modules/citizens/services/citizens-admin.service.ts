import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CITIZENS_REPOSITORY_TOKEN } from '../constants/citizens.tokens';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
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

  async findOne(id: number): Promise<CitizenEntity> {
    const citizen = await this.citizensRepository.findOne(id);

    if (!citizen) {
      throw new NotFoundException('Citizen not found');
    }

    return citizen;
  }

  async update(id: number, updateCitizenDto: UpdateCitizenDto): Promise<CitizenEntity> {
    // Check if citizen exists before updating
    const citizen = await this.citizensRepository.findOne(id);
    if (!citizen) {
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

    return await this.citizensRepository.update(citizen, updateCitizenDto);
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.citizensRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException('Citizen not found');
    }
  }

  async blockCitizen(id: number): Promise<CitizenEntity> {
    const citizen = await this.findOne(id);

    if (citizen.blockedAt) {
      throw new ConflictException('Citizen is already blocked');
    }

    const updatedCitizen = await this.citizensRepository.update(citizen, {
      blockedAt: new Date(),
    });

    return updatedCitizen;
  }

  async unblockCitizen(id: number): Promise<CitizenEntity> {
    const citizen = await this.findOne(id);

    if (!citizen.blockedAt) {
      throw new ConflictException('Citizen is not blocked');
    }

    const updatedCitizen = await this.citizensRepository.update(citizen, {
      blockedAt: null,
    });

    return updatedCitizen;
  }
}
