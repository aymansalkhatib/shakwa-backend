import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { paginate } from '../../../common/pagination/paginate.service';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';
import { ICitizensRepository } from './citizens.repository.interface';

@Injectable()
export class CitizensRepository implements ICitizensRepository {
  constructor(
    @InjectRepository(CitizenEntity)
    private readonly repository: Repository<CitizenEntity>,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<CitizenEntity> {
    const citizen = this.repository.create(createCitizenDto);
    return await this.repository.save(citizen);
  }

  async findAll(filterDto: CitizenFilterDto): Promise<PaginationResponseDto<CitizenResponseDto>> {
    const queryBuilder = this.repository.createQueryBuilder('citizen');

    return paginate(queryBuilder, filterDto, CitizenResponseDto);
  }

  async findOne(id: number): Promise<CitizenEntity | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<CitizenEntity | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<CitizenEntity | null> {
    return await this.repository.findOne({ where: { phone } });
  }

  async update(id: number, updateCitizenDto: UpdateCitizenDto): Promise<CitizenEntity> {
    const citizen = await this.findOne(id);
    if (!citizen) {
      throw new Error(`Citizen with ID ${id} not found`);
    }

    const updatedCitizen = this.repository.merge(citizen, updateCitizenDto);
    return await this.repository.save(updatedCitizen);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected > 0;
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
