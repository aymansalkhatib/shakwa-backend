import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintStatus } from '../../../enums';

export class UpdateComplaintContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
