import { Injectable, Scope } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import { I18nContext, I18nService, i18nValidationMessage } from 'nestjs-i18n';
import {
  TranslationKey,
  TranslationInterpolations,
} from 'src/types/translation-keys';

/**
 * A helper service to simplify translation usage across the application.
 * This service automatically picks up the current request language unless overridden.
 */
@Injectable({ scope: Scope.REQUEST }) // Scoped per request to access I18nContext
export class TranslateHelper {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Translate a given key using the current or custom language context.
   * If no custom language is provided, the current request language will be used.
   *
   * @param key - The translation key (e.g., 'errors.required')
   * @param params - Optional translation parameters
   * @returns A promise that resolves to the translated string
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
   * Retrieve the translation message for validation errors.
   * This function simplifies integrating i18n with validation messages.
   *
   * @param key - The translation key for validation (e.g., 'validation.MAX_LENGTH')
   * @param args - Optional arguments for interpolation in the translation
   * @param lang - Optional language override
   * @returns A function that takes validation arguments and returns the translated message
   */
  static trValMsg(key: TranslationKey): (a: ValidationArguments) => string {
    return i18nValidationMessage(key);
  }

  /**
   * Get the current language from the request context.
   * This is typically used to retrieve the language set by the user in the request.
   *
   * @returns The current language code or undefined if no language is set
   */
  getCurrentLang(): string | undefined {
    return I18nContext.current()?.lang;
  }
}

type TranslateFunction = <K extends TranslationKey>(
  ...args: TranslationInterpolations[K] extends undefined
    ? [key: K]
    : [key: K, interpolations: TranslationInterpolations[K]]
) => string;
