export interface SendLoginLockedOptions {
  to: string;
  subject: string;
  lockDuration: string;
  lockedUntil: string;
  failedAttempts: number;
  ipAddress: string;
}
