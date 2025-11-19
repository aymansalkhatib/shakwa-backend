import { IAuthCodeKeyContext } from './auth-code-key-context.interface';

export interface ICacheCodeParams extends IAuthCodeKeyContext {
  code: string;
  ttlSeconds: number;
}
