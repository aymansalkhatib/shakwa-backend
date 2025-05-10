import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { IsBoolean, IsInt, IsNotEmpty, Min } from 'class-validator';
import { User } from '..';

/**
 * SuperAdmin entity for storing information specific to super admin users.
 * This entity extends the base User entity with fields that are only relevant
 * for super admins, who have the highest level of system access and control.
 */
@Entity('super_admins')
export class SuperAdmin {
  //
  @PrimaryColumn()
  @IsNotEmpty({ message: 'ID is required.' })
  @IsInt({ message: 'ID must be a valid number.' })
  @Min(1, { message: 'ID must be greater than 0.' })
  id: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationship to the base User entity
  @OneToOne(() => User, (user) => user.superAdmin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
