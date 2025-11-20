import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateMyComplaintDto extends OmitType(PartialType(CreateComplaintDto), [
  'authority',
  'category',
]) {}
