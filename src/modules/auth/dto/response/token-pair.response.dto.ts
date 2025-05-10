import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TokenPairResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}