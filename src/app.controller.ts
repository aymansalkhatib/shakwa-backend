import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CustomLogger } from './common/logger/logger.service';
import { SimpleLogger } from './common/logger/simple_logger';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: CustomLogger,
    private readonly logger1: SimpleLogger,
  ) {}

  @Get()
  getHello() {
    // Example of using different log levels
    // this.logger.debug('Processing getHello request', 'AppController');
    // this.logger.log('Handling GET request for root endpoint', 'AppController');
    this.logger1.log('Hello World');
    return "Hello World";
    try {
      return this.appService.getHello();
    } catch (error) {
      // this.logger.error('Error in getHello endpoint',{level_:"asas"});
      throw error;
    }
  }
}
