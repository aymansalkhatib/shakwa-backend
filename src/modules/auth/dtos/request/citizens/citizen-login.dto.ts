import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CitizenLoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsNotEmpty({ message: 'FCM token is required' })
  @IsString({ message: 'FCM token must be a string' })
  fcmToken: string;
}
