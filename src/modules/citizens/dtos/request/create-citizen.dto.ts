import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { SyriaPhone } from '../../../../common/decorators/syria-phone.decorator';

export class CreateCitizenDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(120, { message: 'Email must not exceed 120 characters' })
  email: string;

  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  @SyriaPhone()
  phone: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName: string;
}
