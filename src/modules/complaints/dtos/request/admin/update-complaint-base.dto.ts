import { IsEnum, IsOptional } from 'class-validator';
import { ComplaintAuthority, ComplaintCategory } from '../../..';

export class UpdateComplaintBaseDto {
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @IsOptional()
  @IsEnum(ComplaintAuthority)
  authority?: ComplaintAuthority;
}
