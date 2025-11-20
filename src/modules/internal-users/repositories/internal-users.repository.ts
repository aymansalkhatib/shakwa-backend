import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InternalRole } from '../../../common/enums/role.enum';
import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { paginate } from '../../../common/pagination/paginate.service';
import { ComplaintAuthority } from '../../your-bucket-name';
import { InternalUserEntity } from '../entities/internal-user.entity';
import { ICreateInternalUserData } from './interfaces/create-internal-user-data.interface';
import { IInternalUserFilter } from './interfaces/internal-user-filter.interface';
import { IInternalUserStatistics } from './interfaces/internal-user-statistics.interface';
import { IUpdateInternalUserData } from './interfaces/update-internal-user-data.interface';
import { IInternalUsersRepository } from './internal-users.repository.interface';

@Injectable()
export class InternalUsersRepository implements IInternalUsersRepository {
  constructor(
    @InjectRepository(InternalUserEntity)
    private readonly repository: Repository<InternalUserEntity>,
  ) {}

  async create(data: ICreateInternalUserData): Promise<InternalUserEntity> {
    const internalUser = this.repository.create(data);
    return await this.repository.save(internalUser);
  }

  async findAll(filter: IInternalUserFilter): Promise<IPaginatedResponse<InternalUserEntity>> {
    const queryBuilder = this.repository.createQueryBuilder('internalUser');

    // Apply filters
    this.applyFilters(queryBuilder, filter);

    // Use paginate service
    return await paginate(queryBuilder, filter);
  }

  async findOne(id: number): Promise<InternalUserEntity | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<InternalUserEntity | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async update(
    internalUser: InternalUserEntity,
    data: IUpdateInternalUserData,
  ): Promise<InternalUserEntity> {
    const updatedInternalUser = this.repository.merge(internalUser, data);
    return await this.repository.save(updatedInternalUser);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected > 0;
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async getStatistics(): Promise<IInternalUserStatistics> {
    const qb = this.repository.createQueryBuilder('internalUser');

    const totalInternalUsers = await qb.getCount();

    // Get internal users by role
    const roleStats = await qb
      .select('internalUser.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('internalUser.role')
      .getRawMany<{ role: string; count: string }>();

    const authorityStats = await qb
      .select('internalUser.authority', 'authority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('internalUser.authority')
      .getRawMany<{ authority: string; count: string }>();

    const internalUsersByRole = {} as Record<InternalRole, number>;
    const internalUsersByAuthority = {} as Record<ComplaintAuthority, number>;

    roleStats.forEach((stat) => {
      internalUsersByRole[stat.role as InternalRole] = Number(stat.count) || 0;
    });

    authorityStats.forEach((stat) => {
      internalUsersByAuthority[stat.authority as ComplaintAuthority] = Number(stat.count) || 0;
    });

    return {
      totalInternalUsers,
      internalUsersByRole,
      internalUsersByAuthority,
    };
  }

  /**
   * Applies filters to the query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<InternalUserEntity>,
    filter: IInternalUserFilter,
  ): void {
    // Full name filter
    if (filter.fullName) {
      queryBuilder.andWhere('internalUser.fullName LIKE :fullName', {
        fullName: `%${filter.fullName}%`,
      });
    }

    // Email filter
    if (filter.email) {
      queryBuilder.andWhere('internalUser.email ILIKE :email', { email: `%${filter.email}%` });
    }

    // Role filter
    if (filter.role) {
      queryBuilder.andWhere('internalUser.role = :role', { role: filter.role });
    }

    if (filter.authority) {
      queryBuilder.andWhere('internalUser.authority = :authority', { authority: filter.authority });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('internalUser.createdAt', 'DESC');
  }
}
