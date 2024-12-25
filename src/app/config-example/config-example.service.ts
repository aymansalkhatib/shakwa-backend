import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/config.interface';

@Injectable()
export class ConfigExampleService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  fetchOneConfigs() {
    return this.configService.get('PORT');
  }
}
