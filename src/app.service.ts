import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from './shared/modules/app-logger';

@Injectable()
export class AppService {
  constructor(private readonly logger: AppLogger) {
    this.logger.log('AppService initialized', 'AppService');
  }

  async getHello() {

    throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    this.logger.debug('getHello called', 'AppService');
    return { message: 'Hello World!' };
  }
}
