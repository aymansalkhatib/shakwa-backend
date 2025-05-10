import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { AdminSubRole, MainRole, UserRole } from 'src/common/enums/role.enum';

/**
 * Custom validation to check if a user is not assigned multiple roles from the same level
 * @param validationOptions - Optional validation options
 */
export function IsValidRoleCombination(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidRoleCombination',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Check if value is an array
          if (!Array.isArray(value)) return false;

          // Initialize flags for each role level
          let isEndUser = false;
          let isAdmin = false;
          let isSuperAdmin = false;

          // Loop through the roles and check for multiple roles of the same level
          for (const role of value) {
            // Check the role and assign it to the appropriate flag
            if (role === MainRole.END_USER) {
              isEndUser = true;
            } else if (role === MainRole.ADMIN || Object.values(AdminSubRole).includes(role)) {
              isAdmin = true;
            } else if (role === MainRole.SUPER_ADMIN) {
              isSuperAdmin = true;
            }
          }

          // Ensure only one main role is assigned (cannot assign both admin and regular, etc.)
          const mainRolesCount = [isEndUser, isAdmin, isSuperAdmin].filter(Boolean).length;
          if (mainRolesCount > 1) {
            return false; // More than one main role is not allowed
          }

          return true; // Valid role combination
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return 'Cannot assign more than one role from the same level. For example, you cannot assign multiple admin sub-roles like admin:marketing and admin:hr.';
        },
      },
    });
  };
}
