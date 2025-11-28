import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateCitizenDto } from './create-citizen.dto';

import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateCitizenDto extends OmitType(PartialType(CreateCitizenDto), ['email']) {
  @ValidateIf((o) => o.password)
  @IsNotEmpty({ message: 'Old password is required when updating password' })
  @IsString()
  oldPassword?: string;
}
