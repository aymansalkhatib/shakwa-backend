import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in refresh tokens
 * Used for obtaining new access tokens
 */
export class RefreshTokenPayload {
  /** User's email address */
  email: string;
  
  /** User's unique identifier */
  userId: number;
  
  /** Session number for tracking multiple sessions */
  sessionNumber: number;
  
  /** User's roles for authorization */
  roles: string[];
}

/**
 * Payload retrieved from decoded refresh tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedRefreshTokenPayload extends RefreshTokenPayload, BaseJwtPayload {}