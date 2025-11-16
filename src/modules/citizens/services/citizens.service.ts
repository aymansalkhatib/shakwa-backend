import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CITIZENS_REPOSITORY_TOKEN } from '../constants/citizens.tokens';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
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

  async updateMyAccount(
    citizen: CitizenEntity,
    updateCitizenDto: UpdateCitizenDto,
  ): Promise<CitizenEntity> {
    // Check if email is being updated and already exists
    if (updateCitizenDto.email) {
      const existingCitizen = await this.citizensRepository.findByEmail(updateCitizenDto.email);
      if (existingCitizen && existingCitizen.id !== citizen.id) {
        throw new BadRequestException('Citizen with this email already exists');
      }
    }

    // Check if phone is being updated and already exists
    if (updateCitizenDto.phone) {
      const existingCitizen = await this.citizensRepository.findByPhone(updateCitizenDto.phone);
      if (existingCitizen && existingCitizen.id !== citizen.id) {
        throw new BadRequestException('Citizen with this phone already exists');
      }
    }

    return await this.citizensRepository.update(citizen, updateCitizenDto);
  }

  async deleteMyAccount(id: number): Promise<void> {
    await this.citizensRepository.delete(id);
  }

  async findByEmail(email: string): Promise<CitizenEntity | null> {
    return await this.citizensRepository.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<CitizenEntity | null> {
    return await this.citizensRepository.findByPhone(phone);
  }

  async updateLastLoginAt(citizen: CitizenEntity): Promise<CitizenEntity> {
    return await this.citizensRepository.update(citizen, {
      lastLoginAt: new Date(),
    });
  }

  async updateLastLogoutAt(citizen: CitizenEntity): Promise<CitizenEntity> {
    return await this.citizensRepository.update(citizen, {
      lastLogoutAt: new Date(),
    });
  }
}
