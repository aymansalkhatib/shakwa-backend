import { AccessTokenPayload } from './access-token-payload.interface';
import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in refresh tokens
 * Typically mirrors access token payload with optional extra fields (e.g. token version)
 */
export interface RefreshTokenPayload extends AccessTokenPayload {
  tokenVersion?: number;
}

/**
 * Payload retrieved from decoded refresh tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedRefreshTokenPayload extends RefreshTokenPayload, BaseJwtPayload {}
