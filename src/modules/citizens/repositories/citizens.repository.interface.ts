import { IPaginatedResponse } from '../../../common/pagination/interfaces/paginated-response.interface';
import { CitizenEntity } from '../entities/citizen.entity';
import { ICitizenFilter } from './interfaces/citizen-filter.interface';
import { ICreateCitizenData } from './interfaces/create-citizen-data.interface';
import { IUpdateCitizenData } from './interfaces/update-citizen-data.interface';

export interface ICitizensRepository {
  /**
   * Creates a new citizen
   */
  create(data: ICreateCitizenData): Promise<CitizenEntity>;

  /**
   * Finds all citizens with pagination and filtering
   */
  findAll(filter: ICitizenFilter): Promise<IPaginatedResponse<CitizenEntity>>;

  /**
   * Finds a citizen by ID
   */
  findOne(id: number): Promise<CitizenEntity | null>;

  /**
   * Finds a citizen by email
   */
  findByEmail(email: string): Promise<CitizenEntity | null>;

  /**
   * Finds a citizen by email or phone
   */
  findByEmailOrPhone(email: string, phone: string): Promise<CitizenEntity | null>;

  /**
   * Updates a citizen by ID
   */
  update(id: number, data: IUpdateCitizenData): Promise<CitizenEntity>;

  /**
   * Deletes a citizen by ID
   */
  delete(id: number): Promise<boolean>;

  /**
   * Checks if a citizen exists by ID
   */
  exists(id: number): Promise<boolean>;
}
