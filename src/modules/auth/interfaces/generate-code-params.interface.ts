import { IAuthCodeKeyContext } from './auth-code-key-context.interface';

export interface IGenerateCodeParams extends IAuthCodeKeyContext {
  ttlSeconds: number;
}
