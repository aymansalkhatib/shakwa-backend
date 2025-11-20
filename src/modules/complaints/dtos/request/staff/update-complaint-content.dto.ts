// File: src/modules/your-bucket-name/dtos/request/staff/update-complaint-content.dto.ts

import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * تعديل محتوى الشكوى (title/description/location/attachments)
 * بإنشاء نسخة history جديدة.
 */
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
}
