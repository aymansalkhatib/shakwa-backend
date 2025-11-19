import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '../../../shared/services/mail';
import { SendVerificationCodeOptions } from '../../../shared/services/mail/interfaces/send-verification-code.interface';
import { RedisService } from '../../../shared/services/redis/redis.service';
import { IAuthCodeKeyContext } from '../interfaces/auth-code-key-context.interface';
import { ICacheCodeParams } from '../interfaces/cache-code-params.interface';
import { IGenerateCodeParams } from '../interfaces/generate-code-params.interface';
import { IVerifyCodeParams } from '../interfaces/verify-code-params.interface';

@Injectable()
export class AuthCodeService {
  private static readonly CODE_LENGTH = 6;

  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async generateCode(params: IGenerateCodeParams): Promise<string> {
    const code = this.generateRandomCode();

    await this.cacheCode({ ...params, code });

    console.warn(
      `Generated code "${code}" for email "${params.email}", role "${params.role}", purpose "${params.purpose}"`,
    );

    return code;
  }

  async verifyCode(params: IVerifyCodeParams): Promise<void> {
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

  async cacheCode(params: ICacheCodeParams): Promise<void> {
    await this.redisService.setString(this.genKey(params), params.code, params.ttlSeconds);
  }

  async clearCode(context: IAuthCodeKeyContext): Promise<void> {
    await this.redisService.delete(this.genKey(context));
  }

  async sendCodeViaEmail(data: SendVerificationCodeOptions): Promise<void> {
    const result = await this.mailService.sendVerificationCode(data);
    if (!result) {
      throw new BadRequestException('Failed to send verification code email');
    }
  }

  private genKey({ role, purpose, email }: IAuthCodeKeyContext): string {
    return `${role}:${purpose}:${email.toLowerCase()}`;
  }

  private generateRandomCode(): string {
    const { CODE_LENGTH } = AuthCodeService;
    const min = 10 ** (CODE_LENGTH - 1);
    const max = 10 ** CODE_LENGTH - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }
}
