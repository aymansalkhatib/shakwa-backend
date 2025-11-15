import { PaginationResponseDto } from '../../../common/pagination/dto/pagination-response.dto';
import { CitizenFilterDto } from '../dtos/query/citizen-filter.dto';
import { CreateCitizenDto } from '../dtos/request/create-citizen.dto';
import { UpdateCitizenDto } from '../dtos/request/update-citizen.dto';
import { CitizenResponseDto } from '../dtos/response/citizen-response.dto';
import { CitizenEntity } from '../entities/citizen.entity';

/**
 * Repository interface for Citizen entity operations
 * Abstracts database operations from the service layer
 */
export interface ICitizensRepository {
  /**
   * Creates a new citizen
   */
  create(createCitizenDto: CreateCitizenDto): Promise<CitizenEntity>;

  /**
   * Finds all citizens with pagination and filtering
   */
  findAll(filterDto: CitizenFilterDto): Promise<PaginationResponseDto<CitizenResponseDto>>;

  /**
   * Finds a citizen by ID
   */
  findOne(id: number): Promise<CitizenEntity | null>;

  /**
   * Finds a citizen by email
   */
  findByEmail(email: string): Promise<CitizenEntity | null>;

  /**
   * Finds a citizen by phone
   */
  findByPhone(phone: string): Promise<CitizenEntity | null>;

  /**
   * Updates a citizen by ID
   */
  update(id: number, updateCitizenDto: UpdateCitizenDto): Promise<CitizenEntity>;

  /**
   * Deletes a citizen by ID
   */
  delete(id: number): Promise<boolean>;

  /**
   * Checks if a citizen exists by ID
   */
  exists(id: number): Promise<boolean>;
}
