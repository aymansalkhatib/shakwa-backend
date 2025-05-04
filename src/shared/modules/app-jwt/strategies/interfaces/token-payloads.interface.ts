import { Exclude, Expose } from 'class-transformer';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Exclude()
export class AccessTokenPayload {
  @Expose()
  sessionNumber: number;

  @Expose()
  userId: number;

  @Expose()
  email: string;

  @Expose()
  roles: string[];
}
export class RefreshTokenPayload {
  email: string;
  userId: number;
  sessionNumber: number;
  roles: string[];
}

export class VerificationTokenPayload {
  email: string;
  code: number;
}
