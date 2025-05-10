import { Entity, UpdateDateColumn, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { User } from '..';

/**
 * EndUser entity for storing information specific to regular users.
 * This entity extends the base User entity with fields that are only relevant
 * for regular users of the platform, such as profile information.
 */
@Entity('end_users')
export class EndUser {
  //
  @PrimaryColumn()
  @IsNotEmpty({ message: 'ID is required.' })
  @IsInt({ message: 'ID must be a valid number.' })
  @Min(1, { message: 'ID must be greater than 0.' })
  id: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationship to the base User entity
  @OneToOne(() => User, (user) => user.endUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
