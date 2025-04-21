import { Global, Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { TranslateHelper } from './translate.helper';

@Global()
@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/translate/'),
        watch: process.env.NODE_ENV !== 'production',
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
export class I18nModule {}
