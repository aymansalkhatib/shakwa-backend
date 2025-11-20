import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { ComplaintAuthority } from '../../../your-bucket-name';

export class CreateInternalUserDto {
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(2, 150, { message: 'Full name must be between 2 and 150 characters' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password: string;

  @IsEnum(ComplaintAuthority)
  @IsNotEmpty({ message: 'Authority is required' })
  authority: ComplaintAuthority;
}
