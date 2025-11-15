import { Exclude, Expose } from 'class-transformer';
import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in access tokens
 * Used for authenticating API requests
 */
@Exclude()
export class AccessTokenPayload {
  @Expose()
  userId: number;

  @Expose()
  username: string;
}

/**
 * Payload retrieved from decoded access tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedAccessTokenPayload extends AccessTokenPayload, BaseJwtPayload {}
