import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { CitizenEntity } from '../entities/citizen.entity';
import { ICitizensRepository } from './citizens.repository.interface';
import { ICitizenFilter } from './interfaces/citizen-filter.interface';
import { ICreateCitizenData } from './interfaces/create-citizen-data.interface';
import { IUpdateCitizenData } from './interfaces/update-citizen-data.interface';

@Injectable()
export class CitizensRepository implements ICitizensRepository {
  constructor(
    @InjectRepository(CitizenEntity)
    private readonly repository: Repository<CitizenEntity>,
  ) {}

  async create(data: ICreateCitizenData): Promise<CitizenEntity> {
    const citizen = this.repository.create(data);
    return await this.repository.save(citizen);
  }

  async findAll(filter: ICitizenFilter): Promise<IPaginatedResponse<CitizenEntity>> {
    const queryBuilder = this.repository.createQueryBuilder('citizen');

    // Apply filters
    this.applyFilters(queryBuilder, filter);

    // Use paginate service
    return await paginate(queryBuilder, {
      page: filter.page,
      limit: filter.limit,
    });
  }

  async findOne(id: number): Promise<CitizenEntity | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<CitizenEntity | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByEmailOrPhone(email: string, phone: string): Promise<CitizenEntity | null> {
    return await this.repository.findOne({
      where: [{ email }, { phone }],
    });
  }

  async update(id: number, data: IUpdateCitizenData): Promise<CitizenEntity> {
    const citizen = await this.findOne(id);
    if (!citizen) {
      throw new Error(`Citizen with ID ${id} not found`);
    }

    const updatedCitizen = this.repository.merge(citizen, data);
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

  /**
   * Applies filters to the query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<CitizenEntity>,
    filter: ICitizenFilter,
  ): void {
    // Search filter (searches in email, phone, and fullName)
    if (filter.search) {
      queryBuilder.andWhere(
        '(citizen.email ILIKE :search OR citizen.phone ILIKE :search OR citizen.fullName ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    // Email filter
    if (filter.email) {
      queryBuilder.andWhere('citizen.email = :email', { email: filter.email });
    }

    // Phone filter
    if (filter.phone) {
      queryBuilder.andWhere('citizen.phone = :phone', { phone: filter.phone });
    }

    // Full name filter
    if (filter.fullName) {
      queryBuilder.andWhere('citizen.fullName ILIKE :fullName', {
        fullName: `%${filter.fullName}%`,
      });
    }

    // Blocked filter
    if (filter.blocked !== undefined) {
      if (filter.blocked) {
        queryBuilder.andWhere('citizen.blockedAt IS NOT NULL');
      } else {
        queryBuilder.andWhere('citizen.blockedAt IS NULL');
      }
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('citizen.createdAt', 'DESC');
  }
}
