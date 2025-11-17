import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for security tokens (email verification, password reset, etc.)
 */
export interface SecurityTokenPayload {
  email: string;
  code: string;
  type: 'email_verification' | 'password_reset';
}

/**
 * Payload retrieved from decoded security tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedSecurityTokenPayload extends SecurityTokenPayload, BaseJwtPayload {}
