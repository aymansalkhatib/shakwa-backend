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
  consume?: boolean;
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

    console.warn(
      `Generated code "${code}" for email "${params.email}", role "${params.role}", purpose "${params.purpose}"`,
    );

    return code;
  }

  async verifyCode(params: VerifyCodeParams): Promise<void> {
    const key = this.genKey(params);
    const cachedCode = await this.redisService.getString(key);

    if (!cachedCode || cachedCode !== params.code) {
      throw new BadRequestException(params.errorMessage);
    }

    const shouldConsume = params.consume ?? true;

    if (shouldConsume) {
      await this.redisService.delete(key);
    }
  }

  async cacheCode(params: CacheCodeParams): Promise<void> {
    await this.redisService.setString(this.genKey(params), params.code, params.ttlSeconds);
  }

  async clearCode(context: AuthCodeKeyContext): Promise<void> {
    await this.redisService.delete(this.genKey(context));
  }

  async sendCodeViaEmail(email: string, code: string, context: string): Promise<void> {
    this.logger.log(`[${context}] Sending auth code "${code}" to ${email}`);
  }

  private genKey({ role, purpose, email }: AuthCodeKeyContext): string {
    return `${role}:${purpose}:${email.toLowerCase()}`;
  }

  private generateRandomCode(): string {
    const { CODE_LENGTH } = AuthCodeService;
    const min = 10 ** (CODE_LENGTH - 1);
    const max = 10 ** CODE_LENGTH - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }
}
