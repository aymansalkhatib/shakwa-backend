import { Exclude, Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user.response.dto';
import { TokenPairResponseDto } from './token-pair.response.dto';

@Exclude()
export class LoginResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @Expose()
  @Type(() => TokenPairResponseDto)
  tokens: TokenPairResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}