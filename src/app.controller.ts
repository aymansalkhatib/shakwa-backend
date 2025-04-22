import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { IsString, Length } from 'class-validator';
import { TranslateHelper } from './shared/i18n/translate.helper';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  getHello() {
    return this.appService.getHello();
  }
}
