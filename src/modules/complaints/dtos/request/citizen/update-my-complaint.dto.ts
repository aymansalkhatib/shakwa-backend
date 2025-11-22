import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintStatus } from '../../../enums';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateMyComplaintDto extends OmitType(PartialType(CreateComplaintDto), [
  'authority',
  'category',
]) {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  citizenNote?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  @IsIn([ComplaintStatus.CANCELLED], {
    message: 'Citizens can only change status to CANCELLED',
  })
  status?: ComplaintStatus;
}
