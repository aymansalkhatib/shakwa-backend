import { Injectable, Scope } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import {
  I18nContext,
  I18nService,
  i18nValidationMessage,
  TranslateOptions,
} from 'nestjs-i18n';

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
  async tr(key: string, params: TranslateParams = {}): Promise<string> {
    const { args = {}, defaultValue, options = {}, lang } = params;

    // Get the current language, or fall back to the provided one if available
    const currentLang = lang ?? this.getCurrentLang();

    // Return the translated string
    return await this.i18n.translate(key, {
      lang: currentLang,
      args,
      defaultValue,
      ...options,
    });
  }

  /**
   * Retrieve the translation message for validation errors.
   * This function simplifies integrating i18n with validation messages.
   *
   * @param key - The translation key for validation (e.g., 'validation.MAX_LENGTH')
   * @param args - Optional arguments for interpolation in the translation
   * @param lang - Optional language override
   * @returns A function that takes validation arguments and returns the translated message
   */
  static trValMsg(
    key: string,
    args: Record<string, any> = {},
    lang?: string,
  ): (a: ValidationArguments) => string {
    return i18nValidationMessage(key, { lang, args });
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

/**
 * Parameters used to customize translations.
 */
interface TranslateParams {
  args?: Record<string, any>; // Interpolation variables for the translation (e.g., {property: 'name'})
  defaultValue?: string; // Fallback string if the translation key is missing
  options?: Partial<TranslateOptions>; // Extra options for translation behavior
  lang?: string; // Optional language override (e.g., 'en' or 'ar')
}
