import * as bcrypt from 'bcrypt';
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../../common/enums/role.enum';
import { Session } from '../../../auth/session.entity';
import { Admin } from '../role-specific/admin.entity';
import { EndUser } from '../role-specific/end-user.entity';
import { SuperAdmin } from '../role-specific/super-admin.entity';

/**
 * Base User entity for authentication and role management.
 * This entity contains fields common to all user types and serves as
 * the central point for authentication, role designation, and account status.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Column()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    default: [Role.USER],
  })
  @IsEnum(Role, {
    each: true,
    message: 'Invalid user role. Must be one of the defined UserRole values.',
  })
  @IsNotEmpty({ each: true })
  roles: Role[];

  @Column({ nullable: true, name: 'security_token' })
  @IsOptional()
  securityToken: string;

  @Column({ nullable: true, name: 'verified_at' })
  @IsOptional()
  @IsDate()
  verifiedAt: Date;

  @Column({ nullable: true, name: 'password_changed_at' })
  @IsOptional()
  @IsDate()
  passwordChangedAt: Date;

  @Column({ default: 0, name: 'session_number' })
  sessionNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'blocked_at' })
  @IsOptional()
  @IsDate()
  blockedAt: Date;

  @Column({ nullable: true, name: 'deleted_at' })
  @IsOptional()
  @IsDate()
  deletedAt: Date;

  // Relationships to role-specific entities
  @OneToOne(() => EndUser, (endUser) => endUser.user, { cascade: true })
  endUser: EndUser;

  @OneToOne(() => Admin, (admin) => admin.user, { cascade: true })
  admin: Admin;

  @OneToOne(() => SuperAdmin, (superAdmin) => superAdmin.user, { cascade: true })
  superAdmin: SuperAdmin;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  /**
   * Lifecycle hook to hash the password before inserting the user.
   * Automatically called by TypeORM before entity insertion.
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // Only hash the password if it's a new user or the password was changed
    if (this.password && (!this.id || this.password !== this.password)) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * Validates a provided password against the stored hash.
   * @param plainTextPassword The plain text password to validate
   * @returns True if password matches, false otherwise
   */
  async validatePassword(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this.password);
  }

  /**
   * Checks if the user has a specific role or any role from a list
   * @param roleToCheck The role or list of roles to check
   * @param matchAllRoles (Optional) Boolean to specify if all roles in the array must match
   * @returns True if the user has the specified role or any role from the list (or all roles if matchAllRoles is true)
   */
  hasRole(roleToCheck: Role | Role[], matchAllRoles: boolean = false): boolean {
    if (Array.isArray(roleToCheck)) {
      if (matchAllRoles) {
        return roleToCheck.every((role) => this.roles.includes(role)); // Checks if all roles match
      } else {
        return roleToCheck.some((role) => this.roles.includes(role)); // Checks if any role matches
      }
    } else {
      return this.roles.includes(roleToCheck); // Single role check
    }
  }

  /**
   * Soft deletes the user by setting deletedAt to the current timestamp.
   * This allows for data recovery and audit logging while removing the user from active use.
   */
  softDelete(): void {
    this.deletedAt = new Date();
  }
}
