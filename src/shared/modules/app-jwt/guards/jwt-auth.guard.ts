import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { Observable } from 'rxjs';

/**
 * Error codes used in JWT authentication
 */
export enum JwtErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  USER_BLOCKED = 'USER_BLOCKED',
  USER_DELETED = 'USER_DELETED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_REVOKED = 'SESSION_REVOKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
}

/**
 * Guard that handles JWT authentication and provides detailed error messages
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Activates the guard to check for valid JWT
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  /**
   * Handles the authentication result and provides detailed error messages
   * @param err Error from authentication process
   * @param user User from successful authentication
   * @param info Additional info from passport strategy
   * @returns User object if authentication successful
   * @throws Appropriate exception with detailed message if authentication fails
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.debug(
        `Authentication failed: ${err?.message || info?.message || 'Unknown error'}`,
      );

      // Handle JWT library errors
      if (info instanceof TokenExpiredError) {
        throw new TokenExpiredError('Your session has expired. Please log in again.', null);
      }

      if (info instanceof JsonWebTokenError) {
        throw new JsonWebTokenError('Invalid authentication token. Please log in again.');
      }

      // Handle custom error codes from JWT strategy
      const errorCode = err?.response?.errorCode;
      if (errorCode) {
        switch (errorCode) {
          case JwtErrorCode.USER_NOT_FOUND:
            throw new UnauthorizedException(
              'User not found. Please register or check your credentials.',
            );

          case JwtErrorCode.EMAIL_NOT_VERIFIED:
            throw new UnauthorizedException(
              'Email is not verified. Please check your email for verification instructions.',
            );

          case JwtErrorCode.USER_BLOCKED:
            throw new UnauthorizedException(
              'Your account has been blocked. Please contact support for assistance.',
            );

          case JwtErrorCode.USER_DELETED:
            throw new UnauthorizedException(
              'Your account has been deleted. Please contact support if this was not intended.',
            );

          case JwtErrorCode.SESSION_NOT_FOUND:
            throw new UnauthorizedException('Session not found or invalid. Please log in again.');

          case JwtErrorCode.SESSION_REVOKED:
            throw new UnauthorizedException('Your session has been revoked. Please log in again.');

          case JwtErrorCode.SESSION_EXPIRED:
            throw new UnauthorizedException('Your session has expired. Please log in again.');

          case JwtErrorCode.REFRESH_TOKEN_EXPIRED:
            throw new TokenExpiredError(
              'Your refresh token has expired. Please log in again.',
              null,
            );
        }
      }

      // Fallback error message
      throw new UnauthorizedException(
        err?.message ?? 'Authentication failed. Please log in again.',
      );
    }

    return user;
  }
}
