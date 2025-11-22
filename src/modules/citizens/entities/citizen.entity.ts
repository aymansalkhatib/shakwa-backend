import * as bcrypt from 'bcryptjs';

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

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

  // @OneToMany(() => Complaint, (complaint) => complaint.citizen)
  // your-bucket-name: Complaint[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  fcmToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLogoutAt: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password || this.password.startsWith('$2b$')) return;
    this.password = this.password.trim();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
  }
}
