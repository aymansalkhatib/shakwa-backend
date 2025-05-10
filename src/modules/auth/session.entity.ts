import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsDate, IsIP, IsNumber } from 'class-validator';
import { User } from '../users/entities/base/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Session entity for tracking user authentication sessions.
 * Stores information about active user sessions including tokens,
 * device information, and session status.
 */
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: false })
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: number;

  @Column({ name: 'session_number', nullable: false })
  @IsNumber({}, { message: 'Session number must be a number' })
  @IsNotEmpty({ message: 'Session number is required' })
  sessionNumber: number;

  @Column({ name: 'refresh_token' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken: string;

  @Column({ name: 'user_agent', nullable: true })
  @IsOptional()
  @IsString({ message: 'User agent must be a string' })
  userAgent: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsIP(undefined, { message: 'Invalid IP address' })
  ip: string;

  @Column({ name: 'expires_at' })
  @IsDate()
  expiresAt: Date;

  @Column({ name: 'revoked_at', nullable: true })
  @IsOptional()
  @IsDate()
  revokedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'last_active_at', nullable: true })
  @IsOptional()
  @IsDate()
  lastActiveAt: Date;

  /**
   * Lifecycle hook to hash the refresh token before inserting the session.
   * Uses bcrypt with a secure salt for hashing.
   */
  @BeforeInsert()
  async hashRefreshToken() {
    if (this.refreshToken) {
      const salt = await bcrypt.genSalt(12);
      this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
    }
  }

  /**
   * Validates a provided refresh token against the stored hash.
   * @param plainTextToken The plain text refresh token to validate
   * @returns True if token matches, false otherwise
   */
  async validateRefreshToken(plainTextToken: string): Promise<boolean> {
    return bcrypt.compare(plainTextToken, this.refreshToken);
  }

  /**
   * Revokes the current session.
   * Sets isRevoked to true and records the revocation timestamp.
   */
  revoke(): void {
    this.revokedAt = new Date();
  }

  /**
   * Updates the last active timestamp for the session.
   */
  updateLastActive(): void {
    this.lastActiveAt = new Date();
  }

  /**
   * Checks if the session has expired.
   * @returns True if the session has expired, false otherwise
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
