import { PaginationQueryDto } from '@app/common/pagination/dto/pagination-query.dto';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HttpMethod } from '../entities/audit-log.entity';

export class AuditFilterDto extends PaginationQueryDto {
  // Request Filters
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endpoint?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  @IsOptional()
  @IsString()
  statusGroup?: '2xx' | '3xx' | '4xx' | '5xx';

  // User Filters
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  userType?: string;

  // Client Filters
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientIp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  // Performance Filters
  @IsOptional()
  @IsInt()
  @Min(0)
  minDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDuration?: number;

  // Tracing
  @IsOptional()
  @IsString()
  @MaxLength(100)
  traceId?: string;

  // Date Range
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Search
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  // Sorting
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'durationMs' | 'statusCode' = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
