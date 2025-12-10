import * as bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InternalRole } from '../../../common/enums/role.enum';
import { ComplaintHistoryEntity } from '../../your-bucket-name/entities/complaint-history.entity';
import { ComplaintAuthority } from '../../your-bucket-name/enums/complaint-authority.enum';

@Index('idx_internal_user_email', ['email'])
@Index('idx_internal_user_role', ['role'])
@Index('idx_internal_user_authority', ['authority'])
@Entity('internal_users')
export class InternalUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: InternalRole,
  })
  role: InternalRole;

  @Column({
    type: 'enum',
    enum: ComplaintAuthority,
    nullable: true,
  })
  authority: ComplaintAuthority | null;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 150,
  })
  fullName: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 255,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fcmToken: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  @Column({
    nullable: true,
    type: 'timestamptz',
    name: 'password_changed_at',
  })
  passwordChangedAt: Date | null;

  @Column({
    nullable: true,
    type: 'timestamptz',
    name: 'last_login_at',
  })
  lastLoginAt: Date | null;

  @Column({
    nullable: true,
    type: 'timestamptz',
    name: 'last_logout_at',
  })
  lastLogoutAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  blockedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @OneToMany(() => ComplaintHistoryEntity, (history) => history.internalUser)
  complaintHistories: ComplaintHistoryEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (!this.password || this.password.startsWith('$2b$')) return;

    this.password = this.password.trim();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
  }
}
