import { Injectable } from '@nestjs/common';
import { TranslateHelper } from './shared/modules/app-i18n/translate.helper';

@Injectable()
export class AppService {
  constructor(private readonly t: TranslateHelper) {}

  async getHello() {
    return this.t.tr('test.errors.network');
  }
}
