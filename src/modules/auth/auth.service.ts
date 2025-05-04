import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UserResponseDto } from './dto/auth.response.dto';
import { EnvironmentConfig } from 'src/shared/modules/app-config/env.schema';
import { Session } from '../users/entities/session.entity';
import { AppJwtService } from 'src/shared/modules/app-jwt/app-jwt.service';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from 'src/shared/modules/app-jwt/strategies/interfaces/token-payloads.interface';
import { TokenPairDto } from './dto/token-pair.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private appJwtService: AppJwtService,
    private configService: ConfigService<EnvironmentConfig>,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const verificationToken = await this.appJwtService.createVerificationToken({
      email: registerDto.email,
      code: Math.floor(100000 + Math.random() * 900000),
    });

    const user = this.usersRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      verificationToken,
      verifiedAt: new Date(), //TODO
    });

    await this.usersRepository.save(user);

    return;
  }

  async confirmEmail(token: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.verifiedAt = new Date();
    user.verificationToken = null;
    await this.usersRepository.save(user);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email: loginDto.email },
      });

      if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.verifiedAt) {
        throw new UnauthorizedException('Email is not verified.');
      }

      if (user.blockedAt) {
        throw new UnauthorizedException('User is blocked.');
      }

      if (user.deletedAt) {
        throw new UnauthorizedException('User has been deleted.');
      }

      user.sessionNumber++;

      const tokens: TokenPair = this.appJwtService.generateTokens({
        sessionNumber: user.sessionNumber,
        userId: user.id,
        email: user.email,
        roles: user.roles,
      });

      const threshold = user.sessionNumber - 10; //TODO
      await queryRunner.manager.delete(Session, {
        userId: user.id,
        sessionNumber: LessThanOrEqual(threshold),
      });

      const session = queryRunner.manager.create(Session, {
        user: { id: user.id },
        refreshToken: tokens.refreshToken,
        sessionNumber: user.sessionNumber,
      });

      await queryRunner.manager.save(session);

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return {
        tokens,
        user,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async logout(user: UserResponseDto) {
    console.log(user);
    return await this.sessionRepository.delete({
      userId: user.id,
      sessionNumber:user.sessionNumber,
    });
  }

  async refreshTokens(tokens: TokenPairDto) {
    const refreshTokenData: RefreshTokenPayload & {
      exp?: number;
      iat?: number;
    } = this.appJwtService.verifyRefreshToken(tokens.refreshToken);

    const accessTokenData: AccessTokenPayload & {
      exp?: number;
      iat?: number;
    } = this.appJwtService.verifyAccessToken(tokens.accessToken, true);

    if (
      accessTokenData.userId !== refreshTokenData.userId ||
      accessTokenData.sessionNumber !== refreshTokenData.sessionNumber
    ) {
      throw new ForbiddenException('Access denied due to invalid token or session.');
    }

    const user = await this.usersRepository.findOneBy({
      id: refreshTokenData.userId,
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (!user.verifiedAt) {
      throw new UnauthorizedException('Email is not verified.');
    }

    if (user.blockedAt) {
      throw new UnauthorizedException('User is blocked.');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User has been deleted.');
    }

    if (
      user.passwordChangedAt != null &&
      refreshTokenData.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      throw new UnauthorizedException('Password has been changed since the token was issued.');
    }

    const session = await this.sessionRepository.findOneBy({
      userId: refreshTokenData.userId,
      sessionNumber: refreshTokenData.sessionNumber,
    });
    if (!session) {
      throw new NotFoundException('err');
    }

    const refreshTokenMatches = await bcrypt.compare(tokens.refreshToken, session.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const expirationDate = new Date(accessTokenData.exp * 1000);
    if (expirationDate > new Date()) {
      throw new UnauthorizedException('Access token is still valid, cannot proceed.');
    }

    const payloadInstance = plainToInstance(AccessTokenPayload, accessTokenData);

    const cleanPayload = instanceToPlain(payloadInstance) as AccessTokenPayload;

    return { accessToken: this.appJwtService.createAccessToken(cleanPayload) };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    return user;
  }
}
