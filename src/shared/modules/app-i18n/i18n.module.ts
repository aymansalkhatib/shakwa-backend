import { Global, Module } from '@nestjs/common';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { Environment } from '../app-config/env.constant';
import { DEFAULT_LANGUAGE } from './constants';
import { TranslateHelper } from './translate.helper';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      loaderOptions: {
        path: path.join(__dirname, '/translate/'),
        watch: process.env.NODE_ENV !== Environment.PRODUCTION,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  providers: [TranslateHelper],
  exports: [TranslateHelper],
})
export class AppI18nModule {}
