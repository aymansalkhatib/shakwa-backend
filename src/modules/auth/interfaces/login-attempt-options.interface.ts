export interface ILoginAttemptOptions {
  key: string;
  maxAttempts: number;
  blockSeconds: number;
  windowSeconds: number;
  ipAddress: string;
  email: string;
}
