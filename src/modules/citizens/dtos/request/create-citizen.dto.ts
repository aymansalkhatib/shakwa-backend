import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCitizenDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @MaxLength(120, { message: 'Email must not exceed 120 characters' })
  email?: string | null;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string | null;

  @IsString({ message: 'Password must be a string' })
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string | null;

  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName: string;
}
