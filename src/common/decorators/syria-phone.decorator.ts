import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

interface SyriaPhoneOptions {
  /**
   * Auto-format international numbers to local format
   * Example: +963968381624 → 0968381624
   * @default false
   */
  formatToLocal?: boolean;

  /**
   * Auto-format local numbers to international format
   * Example: 0968381624 → +963968381624
   * @default false
   */
  formatToInternational?: boolean;
}

function transformSyriaPhone(options?: SyriaPhoneOptions) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const phoneNumber = String(value);
    let formatted = phoneNumber;

    // Format to local (remove +963 and add 0)
    if (options?.formatToLocal && phoneNumber.startsWith('+963')) {
      formatted = '0' + phoneNumber.substring(4);
    }

    // Format to international (remove leading 0 and add +963)
    if (options?.formatToInternational && phoneNumber.startsWith('0')) {
      formatted = '+963' + phoneNumber.substring(1);
    }

    return formatted;
  });
}

function isValidSyriaPhone(phone: string): boolean {
  return /^09[0-9]{8}$/.test(phone) || /^\+9639[0-9]{8}$/.test(phone);
}

export function SyriaPhone(options?: SyriaPhoneOptions, validationOptions?: ValidationOptions) {
  return applyDecorators(
    transformSyriaPhone(options),
    (target: Object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'SyriaPhone',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            if (value === undefined || value === null || value === '') {
              return true;
            }
            if (!isString(value)) return false;
            return isValidSyriaPhone(value);
          },
          defaultMessage(args: ValidationArguments) {
            return TranslateHelper.trValMsg('pipes.validation.invalid_syria_phone', {
              property: args.property,
            })(args);
          },
        },
      });
    },
  );
}
