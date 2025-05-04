

/**
 * Hierarchical role system with main roles and sub-roles
 */
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export enum AdminSubRole {
  MARKETING = 'admin:marketing',
  MANAGEMENT = 'admin:management',
}

export type UserRole = Role | AdminSubRole;

export const ROLE_HIERARCHY = {
  //
  [Role.SUPERADMIN]: [
    // SUPERADMIN can inherit permissions from ADMIN, USER, or any AdminSubRoles if needed
    //Role.ADMIN, Role.USER, ...Object.values(AdminSubRole)
  ],
  //
  [Role.ADMIN]: [
    // Role.USER, // Optional: uncomment if ADMIN should inherit USER privileges
    ...Object.values(AdminSubRole),
  ],
  //
  [AdminSubRole.MARKETING]: [
    // Role.USER, // Optional: uncomment if MARKETING should inherit USER privileges
  ],
  //
  [AdminSubRole.MANAGEMENT]: [
    // Role.USER, // Optional: uncomment if MANAGEMENT should inherit USER privileges
  ],
  //
  [Role.USER]: [],
};
