import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Token expired
      if (info && info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired.');
      }

      // Invalid token
      if (info && info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token.');
      }

      // Handling custom error codes based on the user status

      // Check for user not found
      if (err?.response?.errorCode === 'USER_NOT_FOUND') {
        throw new UnauthorizedException('User not found.');
      }

      // Check for email verification
      if (err?.response?.errorCode === 'EMAIL_NOT_VERIFIED') {
        throw new UnauthorizedException('Email is not verified.');
      }

      // Check for blocked user
      if (err?.response?.errorCode === 'USER_BLOCKED') {
        throw new UnauthorizedException('User is blocked.');
      }

      // Check for deleted user
      if (err?.response?.errorCode === 'USER_DELETED') {
        throw new UnauthorizedException('User has been deleted.');
      }

      // Fallback error message if no specific error is matched
      throw new UnauthorizedException('Unauthorized.');
    }

    // If everything is fine, return the user

    return user;
  }
}
