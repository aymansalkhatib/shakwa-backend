import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class InternalUserVerifyResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Reset code is required' })
  @Length(6, 6, { message: 'Reset code must be exactly 6 digits' })
  code: string;
}
