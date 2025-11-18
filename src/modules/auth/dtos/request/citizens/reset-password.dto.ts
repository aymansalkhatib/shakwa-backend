import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsLessThanOrEqual } from '../../../../../common/decorators/is-less-than-or-equal.decorator';
import { MatchFields } from '../../../../../common/decorators/match-fields.decorator';

@MatchFields(['newPassword', 'confirmPassword'], {
  message: 'New password and confirm password must match',
})
export class ResetPasswordDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsLessThanOrEqual('wEWBSDKHDHASGHDJAH')
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  newPassword: string;

  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
}
