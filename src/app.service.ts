import { Injectable } from '@nestjs/common';
import { CustomLogger } from './common/logger/logger.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: CustomLogger) {}

  getHello(): string {
    // this.logger.log('Generating hello message', { meta: 'AppService' });
    throw new Error('An error occurred while generating the hello message');

    return 'Hello World!';
  }
}
