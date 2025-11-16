import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { InternalUserEntity } from '../entities/internal-user.entity';
import { ICreateInternalUserData } from './interfaces/create-internal-user-data.interface';
import { IInternalUserFilter } from './interfaces/internal-user-filter.interface';
import { IInternalUserStatistics } from './interfaces/internal-user-statistics.interface';
import { IUpdateInternalUserData } from './interfaces/update-internal-user-data.interface';

export interface IInternalUsersRepository {
  /**
   * Creates a new internal user
   */
  create(data: ICreateInternalUserData): Promise<InternalUserEntity>;

  /**
   * Finds all internal users with pagination and filtering
   */
  findAll(filter: IInternalUserFilter): Promise<IPaginatedResponse<InternalUserEntity>>;

  /**
   * Finds an internal user by ID
   */
  findOne(id: number): Promise<InternalUserEntity | null>;

  /**
   * Finds an internal user by email
   */
  findByEmail(email: string): Promise<InternalUserEntity | null>;

  /**
   * Updates an internal user
   */
  update(
    internalUser: InternalUserEntity,
    data: IUpdateInternalUserData,
  ): Promise<InternalUserEntity>;

  /**
   * Deletes an internal user by ID
   */
  delete(id: number): Promise<boolean>;

  /**
   * Checks if an internal user exists by ID
   */
  exists(id: number): Promise<boolean>;

  /**
   * Gets internal users statistics including total, by role, etc.
   */
  getStatistics(): Promise<IInternalUserStatistics>;
}
