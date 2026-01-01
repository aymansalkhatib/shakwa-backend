import { IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  userType?: string;

  @IsNotEmpty()
  @IsString()
  method: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsNumber()
  responseTime?: number;

  @IsOptional()
  @IsObject()
  requestBody?: any;

  @IsOptional()
  @IsObject()
  queryParams?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
