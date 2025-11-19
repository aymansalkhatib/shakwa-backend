/**
 * Basic user roles used for authorization.
 */
export enum Role {
  CITIZEN = 'citizen',
  STAFF = 'staff',
  ADMIN = 'admin',
}

export enum InternalRole {
  STAFF = Role.STAFF,
  ADMIN = Role.ADMIN,
}

/**
 * Mapping between InternalRole and Role.
 */
export const InternalRoleToRoleMap: Record<InternalRole, Role> = {
  [InternalRole.STAFF]: Role.STAFF,
  [InternalRole.ADMIN]: Role.ADMIN,
};

/**
 * For reverse, Role to InternalRole (if mapping exists)
 */
export const RoleToInternalRoleMap: Partial<Record<Role, InternalRole>> = {
  [Role.STAFF]: InternalRole.STAFF,
  [Role.ADMIN]: InternalRole.ADMIN,
};
