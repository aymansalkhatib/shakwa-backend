import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

type InvalidField = [string, string];

interface FieldGroup {
  fields: InvalidField;
  isRequired: boolean;
}

@ValidatorConstraint({ name: 'OnlyOneOf', async: false })
export class OnlyOneOfConstraint implements ValidatorConstraintInterface {
  private invalidGroup: FieldGroup[] = [];

  validate(_: any, args: ValidationArguments): boolean {
    const object = args.object as any;
    const fieldGroups = args.constraints[0] as FieldGroup[];

    this.invalidGroup = [];

    for (const group of fieldGroups) {
      const { fields, isRequired } = group;

      const definedFields = fields.filter(
        (field) => object[field] !== undefined && object[field] !== null && object[field] !== '',
      );

      if (isRequired) {
        // Must provide exactly one field from the group
        if (definedFields.length !== 1) {
          this.invalidGroup.push(group);
        }
      } else {
        // Optional: can provide 0, 1, or 2 fields (but if providing, only one is allowed)
        if (definedFields.length > 1) {
          this.invalidGroup.push(group);
        }
      }
    }

    return this.invalidGroup.length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    // If a custom message is provided, use it
    if (args.constraints[1] && typeof args.constraints[1] === 'string') {
      return args.constraints[1];
    }

    let messages: string[] = [];

    this.invalidGroup.forEach((group) => {
      if (group.isRequired) {
        messages.push(
          TranslateHelper.trValMsg('pipes.validation.exactly_one_of_fields', {
            fields: group.fields.join(', '),
          })(args),
        );
      } else {
        messages.push(
          TranslateHelper.trValMsg('pipes.validation.only_one_of_fields', {
            fields: group.fields.join(', '),
          })(args),
        );
      }
    });

    return messages.join(', ');
  }
}

export function OnlyOneOf(fieldGroups: FieldGroup[], validationOptions?: ValidationOptions) {
  return function (constructor: any) {
    // Extract message from validationOptions if provided
    const message = validationOptions?.message;

    registerDecorator({
      name: 'OnlyOneOf',
      target: constructor,
      options: validationOptions,
      constraints: [fieldGroups, message],
      validator: OnlyOneOfConstraint,
      propertyName: undefined!,
    });
  };
}
