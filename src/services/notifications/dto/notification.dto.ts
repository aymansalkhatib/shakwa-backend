import { IsString, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';

export class BaseNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  ttlInSeconds?: number;

  @IsOptional()
  @IsString()
  priority?: 'high' | 'normal';

  @IsOptional()
  @IsString()
  sound?: string;

  @IsOptional()
  @IsString()
  clickAction?: string;
}

export class TokensNotificationDto extends BaseNotificationDto {
  @IsArray()
  @IsString({ each: true })
  tokens: string[];
}

export class TopicNotificationDto extends BaseNotificationDto {
  @IsString()
  topic: string;
}

export class SingleTokenNotificationDto extends BaseNotificationDto {
  @IsString()
  token: string;
}
