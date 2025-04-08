import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    try {
      // throw new NotFoundException({
      //   request: 'failure',
      //   message: 'Resource not found',
      //   data: { id: 123, entity: 'User' },
      // });
      return this.appService.getHello();
    } catch (error) {
      throw error;
    }
  }
}
