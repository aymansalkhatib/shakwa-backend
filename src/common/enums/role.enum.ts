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
