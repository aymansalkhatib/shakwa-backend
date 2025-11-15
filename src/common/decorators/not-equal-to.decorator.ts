import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

export function NotEqualTo(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'notEqualTo',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value !== relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return TranslateHelper.trValMsg('pipes.validation.must_not_equal', {
            property: args.property,
            relatedProperty: relatedPropertyName,
          })(args);
        },
      },
    });
  };
}
