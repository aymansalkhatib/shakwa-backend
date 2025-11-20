import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateMyComplaintDto extends OmitType(PartialType(CreateComplaintDto), [
  'authority',
  'category',
]) {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
