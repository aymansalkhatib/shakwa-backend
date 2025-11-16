import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCitizenDto } from '../../../../citizens/dtos/request/create-citizen.dto';

export class CitizenRegisterDto extends CreateCitizenDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}
