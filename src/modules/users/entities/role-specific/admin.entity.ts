import { Entity, UpdateDateColumn, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { User } from '../index';

/**
 * Admin entity for storing information specific to admin users.
 * This entity extends the base User entity with admin-specific fields,
 * such as department, permissions, and activity logs.
 */
@Entity('admins')
export class Admin {
  //
  @PrimaryColumn()
  @IsNotEmpty({ message: 'ID is required.' })
  @IsInt({ message: 'ID must be a valid number.' })
  @Min(1, { message: 'ID must be greater than 0.' })
  id: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationship to the base User entity
  @OneToOne(() => User, (user) => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
