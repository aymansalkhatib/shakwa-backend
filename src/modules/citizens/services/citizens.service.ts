import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { paginate } from '../../../common/pagination/paginate.service';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';

@Injectable()
export class CitizensService {
  constructor(
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<CitizenEntity> {
    const citizen = this.citizenRepository.create(createCitizenDto);
    const savedCitizen = await this.citizenRepository.save(citizen);
    return savedCitizen;
  }

  async findAll(
    filterCitizenDto: CitizenFilterDto,
  ): Promise<PaginationResponseDto<CitizenResponseDto>> {
    const queryBuilder = this.citizenRepository.createQueryBuilder('citizen');

    return paginate(queryBuilder, filterCitizenDto, CitizenResponseDto);
  }

  async findOne(id: number): Promise<CitizenResponseDto> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });

    if (!citizen) {
      throw new NotFoundException('Citizen not found');
    }

    return citizen;
  }

  async update(id: number, updateCitizenDto: UpdateCitizenDto): Promise<CitizenEntity> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });

    if (!citizen) {
      throw new NotFoundException('Citizen not found');
    }

    const updatedCitizen = this.citizenRepository.merge(citizen, updateCitizenDto);
    const savedCitizen = await this.citizenRepository.save(updatedCitizen);
    return savedCitizen;
  }

  async delete(id: number): Promise<void> {
    const result = await this.citizenRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Citizen not found');
    }
  }
}
