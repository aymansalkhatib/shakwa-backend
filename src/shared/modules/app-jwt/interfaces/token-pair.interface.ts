/**
 * Interface representing a pair of JWT tokens used for authentication
 * Contains both access and refresh tokens returned to clients after login
 */
export interface TokenPair {
  /** Short-lived token used for API authorization */
  accessToken: string;
  
  /** Long-lived token used to obtain new access tokens */
  refreshToken: string;
}