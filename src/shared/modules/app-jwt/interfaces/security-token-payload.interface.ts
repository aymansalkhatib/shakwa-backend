import { BaseJwtPayload } from './base-jwt-payload.interface';

/**
 * Payload for storing data in security tokens
 * Used for various security operations like email verification and password reset
 */
export interface SecurityTokenPayload {
  /** User's email address for identification */
  email: string;
  
  /** Verification code (typically 6 digits) for user confirmation */
  code: number;
  
  /** 
   * Token type to distinguish between different security operations
   * - 'email_verification': Used for verifying user email addresses
   * - 'password_reset': Used for password reset flows
   */
  type: 'email_verification' | 'password_reset';
}

/**
 * Payload retrieved from decoded security tokens
 * Extends the storage payload with standard JWT timestamp fields
 */
export interface DecodedSecurityTokenPayload extends SecurityTokenPayload, BaseJwtPayload {}