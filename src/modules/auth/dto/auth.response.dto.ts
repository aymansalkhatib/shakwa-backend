import { Exclude, Expose, Type } from 'class-transformer';
import { UserRole } from 'src/common/enums/role.enum';

@Exclude()
export class TokenPairResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;
}

@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  roles: UserRole[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  verificationToken: string | null;

  passwordChangedAt: Date | null;

  verifiedAt: Date | null;

  blockedAt: Date | null;

  sessionNumber: number;

  deletedAt: Date | null;

  logoutAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

@Exclude()
export class RegisterResponseDto {
  @Expose()
  message: string;
}

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
