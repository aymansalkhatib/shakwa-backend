import { Global, Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { TranslateHelper } from './translate.helper';
import { Environment } from 'src/shared/modules/app-config/env.constant';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
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
