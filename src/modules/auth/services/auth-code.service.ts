import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { RedisService } from '../../../shared/services/redis/redis.service';

export enum AuthCodePurpose {
  EMAIL_VERIFICATION_CODE = 'email_verification_code',
  EMAIL_VERIFICATION_TOKEN = 'email_verification_token',
  PASSWORD_RESET_CODE = 'password_reset_code',
  PASSWORD_RESET_TOKEN = 'password_reset_token',
}

export interface AuthCodeKeyContext {
  role: Role;
  email: string;
  purpose: AuthCodePurpose;
}

interface GenerateCodeParams extends AuthCodeKeyContext {
  ttlSeconds: number;
}

interface VerifyCodeParams extends AuthCodeKeyContext {
  code: string;
  errorMessage: string;
}

interface CacheCodeParams extends AuthCodeKeyContext {
  code: string;
  ttlSeconds: number;
}

@Injectable()
export class AuthCodeService {
  private static readonly CODE_LENGTH = 6;
  private readonly logger = new Logger(AuthCodeService.name);

  constructor(private readonly redisService: RedisService) {}

  async generateCode(params: GenerateCodeParams): Promise<string> {
    const code = this.generateRandomCode();

    await this.cacheCode({ ...params, code });

    return code;
  }

  async verifyCode(params: VerifyCodeParams): Promise<void> {
    const key = this.composeKey(params);
    const cachedCode = await this.redisService.getString(key);

    if (!cachedCode || cachedCode !== params.code) {
      throw new BadRequestException(params.errorMessage);
    }

    await this.redisService.delete(key);
  }

  async cacheCode(params: CacheCodeParams): Promise<void> {
    await this.redisService.setString(this.composeKey(params), params.code, params.ttlSeconds);
  }

  async clearCode(context: AuthCodeKeyContext): Promise<void> {
    await this.redisService.delete(this.composeKey(context));
  }

  async sendCodeViaEmail(email: string, code: string, context: string): Promise<void> {
    this.logger.log(`[${context}] Sending auth code "${code}" to ${email}`);
  }

  private composeKey({ role, purpose, email }: AuthCodeKeyContext): string {
    return `${role}:${purpose}:email:${email.toLowerCase()}`;
  }

  private generateRandomCode(): string {
    const { CODE_LENGTH } = AuthCodeService;
    const min = 10 ** (CODE_LENGTH - 1);
    const max = 10 ** CODE_LENGTH - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }
}
