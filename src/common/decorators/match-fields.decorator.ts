import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchFields', async: false })
export class MatchFieldsConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments): boolean {
    const [fields] = args.constraints;
    const object = args.object as any;

    if (!Array.isArray(fields) || fields.length < 2) {
      return false;
    }

    const firstValue = object[fields[0]];
    return fields.every((field) => object[field] === firstValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const [fields, options] = args.constraints;
    if (options?.message) {
      return options.message;
    }
    return `${fields.join(', ')} must match`;
  }
}

export function MatchFields(fields: string[], validationOptions?: ValidationOptions) {
  return function (constructor: any) {
    registerDecorator({
      name: 'MatchFields',
      target: constructor,
      propertyName: undefined!,
      options: validationOptions,
      constraints: [fields, validationOptions],
      validator: MatchFieldsConstraint,
    });
  };
}
