import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomLogger } from './common/logger/logger.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: CustomLogger,
  ) {}

  @Get()
  getHello() {
    // Example of using different log levels
    // this.logger.debug('Processing getHello request', 'AppController');
    // this.logger.log('Handling GET request for root endpoint', 'AppController');

    try {
      return this.appService.getHello();
    } catch (error) {
      this.logger.error('Error in getHello endpoint');
      throw error;
    }
  }
}
