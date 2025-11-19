// File: src/modules/your-bucket-name/dtos/request/citizen/create-complaint.dto.ts

import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ComplaintAuthority } from '../../../enums/complaint-authority.enum';
import { ComplaintCategory } from '../../../enums/complaint-category.enum';
import { ComplaintPriority } from '../../../enums/complaint-priority.enum';

export class CreateComplaintDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description: string;

  @IsEnum(ComplaintAuthority, { message: 'Authority must be a valid ComplaintAuthority' })
  authority: ComplaintAuthority;

  @IsOptional()
  @IsEnum(ComplaintCategory, { message: 'Category must be a valid ComplaintCategory' })
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintPriority, { message: 'Priority must be a valid ComplaintPriority' })
  priority?: ComplaintPriority;

  @IsOptional()
  @IsString({ message: 'Location text must be a string' })
  @MaxLength(255, { message: 'Location must not exceed 255 characters' })
  locationText?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a number' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a number' })
  longitude?: number;

  @IsOptional()
  @IsArray({ message: 'Attachments must be an array of strings' })
  @IsString({ each: true, message: 'Each attachment must be a string' })
  @ArrayMaxSize(10, { message: 'You can attach up to 10 files only' })
  attachments?: string[];
}
