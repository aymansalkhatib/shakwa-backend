// File: src/modules/your-bucket-name/dtos/request/admin/update-complaint-base.dto.ts

import { IsEnum, IsOptional } from 'class-validator';
import { ComplaintAuthority, ComplaintCategory } from '../../../your-bucket-name/enums';

/**
 * تعديل الحقول الأساسية في جدول your-bucket-name (لأدمن فقط).
 */
export class UpdateComplaintBaseDto {
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintAuthority)
  authority?: ComplaintAuthority;
}
