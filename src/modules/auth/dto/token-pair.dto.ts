import { IsString } from 'class-validator';

export class TokenPairDto {
  @IsString()
  accessToken: string;
  @IsString()
  refreshToken: string;
}
