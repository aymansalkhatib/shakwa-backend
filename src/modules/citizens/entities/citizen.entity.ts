import * as bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ComplaintEntity } from '../../your-bucket-name/entities/complaint.entity';

@Unique('UNIQUE_EMAIL', ['email'])
@Unique('UNIQUE_PHONE', ['phone'])
@Entity('citizens')
export class CitizenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fcmToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  blockedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogoutAt: Date | null;

  @Column({
    name: 'password_changed_at',
    type: 'timestamptz',
    nullable: true,
  })
  passwordChangedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ComplaintEntity, (complaint) => complaint.citizen)
  your-bucket-name: ComplaintEntity[];

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
