import { Injectable } from '@nestjs/common';
import { TranslateHelper } from './shared/i18n/translate.helper';

@Injectable()
export class AppService {
  constructor(private readonly t: TranslateHelper) {}

  async getHello() {
    this.t.tr('test.errors.network');
  }
}
