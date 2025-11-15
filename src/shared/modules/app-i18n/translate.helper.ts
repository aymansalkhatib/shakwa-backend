import { Injectable, Scope } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import { I18nContext, I18nService, i18nValidationMessage } from 'nestjs-i18n';
import { SUPPORTED_LANGUAGES } from './constants';
import { TranslationInterpolations, TranslationKey } from './translation-keys';

/**
 * A helper service to simplify translation usage across the application.
 * This service automatically picks up the current request language unless overridden.
 */
@Injectable({ scope: Scope.REQUEST }) // Scoped per request to access I18nContext
export class TranslateHelper {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Returns a localized validation message function for the given translation key.
   * Useful for integrating i18n with class-validator error messages.
   *
   * @param key - The i18n translation key for validation (e.g., 'validation.MAX_LENGTH')
   * @returns A function that receives validation arguments and returns the translated message
   */
  static trValMsg(key: TranslationKey, interpolations?: any): (a: ValidationArguments) => string {
    return (args: ValidationArguments) => {
      return i18nValidationMessage(key, {
        ...interpolations,
        property: I18nContext.current()?.translate
          ? I18nContext.current().translate('keys.' + args.property)
          : args.property,
      })(args);
    };
  }

  /**
   * Translates the given key using the current language context or an optional override.
   *
   * @param key - The translation key (e.g., 'errors.required')
   * @param interpolations - Optional dynamic values for placeholder interpolation
   * @returns The translated string in the appropriate language
   */
  tr: TranslateFunction = <K extends TranslationKey>(
    key: K,
    interpolations?: TranslationInterpolations[K],
  ): string => {
    const currentLang = this.getCurrentLang();
    return this.i18n.translate(key, {
      lang: currentLang,
      args: interpolations,
    });
  };

  /**
   * Get the current language from the request context.
   * This is typically used to retrieve the language set by the user in the request.
   *
   * @returns The current language code or undefined if no language is set
   */
  getCurrentLang(): string | undefined {
    return I18nContext.current()?.lang;
  }

  /**
   * Checks if the given language is supported.
   *
   * @param lang - The language code to check
   * @returns True if the language is supported
   */
  isLangSupported(lang: string): boolean {
    return SUPPORTED_LANGUAGES.includes(lang as any);
  }
}

type TranslateFunction = <K extends TranslationKey>(
  ...args: TranslationInterpolations[K] extends undefined
    ? [key: K]
    : [key: K, interpolations: TranslationInterpolations[K]]
) => string;
