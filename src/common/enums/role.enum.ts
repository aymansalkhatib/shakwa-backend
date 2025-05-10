/**
 * Enum defining all user roles and sub-roles in the system.
 * Used for role-based access control and fine-grained permission management.
 */
export enum UserRole {
  /**
   * End user with basic access to the platform
   * - Manages their own profile
   * - Has access to standard platform features
   * - Participates in general user activities
   */
  END_USER = 'end_user',

  /**
   * Administrative user with elevated privileges
   * - Can manage users within their scope
   * - Access administrative tools and reports
   * - Handle department-specific operations
   */
  ADMIN = 'admin',

  /**
   * Super administrator with system-wide access
   * - Full system access and control
   * - Can manage all users including admins
   * - Access to security and system configuration
   * - Responsible for platform-wide operations
   */
  SUPER_ADMIN = 'super_admin',

  /**
   * Marketing administrator
   * - Manage marketing campaigns
   * - Access analytics and reporting
   * - Handle content management
   */
  ADMIN_MARKETING = 'admin:marketing',

  /**
   * Operations administrator
   * - Oversee day-to-day operations
   * - Handle resource allocation
   * - Manage operational workflows
   */
  ADMIN_OPERATIONS = 'admin:operations',

  /**
   * Finance administrator
   * - Handle financial operations
   * - Manage billing and payments
   * - Access financial reporting
   */
  ADMIN_FINANCE = 'admin:finance',

  /**
   * HR administrator
   * - Manage user accounts
   * - Handle user support
   * - Oversee user compliance
   */
  ADMIN_HR = 'admin:hr',
}

/**
 * Role hierarchy defining permission inheritance.
 * Enables flexible and hierarchical role-based access control.
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.ADMIN,
    UserRole.END_USER,
    UserRole.ADMIN_MARKETING,
    UserRole.ADMIN_OPERATIONS,
    UserRole.ADMIN_FINANCE,
    UserRole.ADMIN_HR,
  ],

  [UserRole.ADMIN]: [
    UserRole.END_USER,
    UserRole.ADMIN_MARKETING,
    UserRole.ADMIN_OPERATIONS,
    UserRole.ADMIN_FINANCE,
    UserRole.ADMIN_HR,
  ],

  [UserRole.ADMIN_MARKETING]: [UserRole.END_USER],
  [UserRole.ADMIN_OPERATIONS]: [UserRole.END_USER],
  [UserRole.ADMIN_FINANCE]: [UserRole.END_USER],
  [UserRole.ADMIN_HR]: [UserRole.END_USER],

  [UserRole.END_USER]: [],
};

export enum MainRole {
  END_USER = 'end_user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum AdminSubRole {
  MARKETING = 'admin:marketing',
  OPERATIONS = 'admin:operations',
  FINANCE = 'admin:finance',
  HR = 'admin:hr',
}
