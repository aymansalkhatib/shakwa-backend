import { Injectable } from '@nestjs/common';
import { AppLogger } from './shared/modules/app-logger';

@Injectable()
export class AppService {
  constructor(private readonly logger: AppLogger) {
    this.logger.log('AppService initialized', 'AppService');
  }

  async getHello() {
    this.logger.debug('getHello called', 'AppService');
    return { message: 'Hello World!' };
  }
}
