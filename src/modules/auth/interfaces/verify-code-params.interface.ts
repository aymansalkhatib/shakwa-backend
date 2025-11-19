import { IAuthCodeKeyContext } from './auth-code-key-context.interface';

export interface IVerifyCodeParams extends IAuthCodeKeyContext {
  code: string;
  errorMessage: string;
  consume?: boolean;
}
