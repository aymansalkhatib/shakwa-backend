import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttle guard for rate limiting
 * Can be extended to implement custom rate limiting logic
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as the tracker
    // In production, consider using authenticated user ID
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new Error('Too many requests. Please try again later.');
  }
}
