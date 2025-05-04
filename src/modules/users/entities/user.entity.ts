import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Session } from './session.entity';
import { UserRole } from 'src/common/enums/role.enum';

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number; // SQLite يستخدم int عادة لل IDs

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'simple-array', default: Role.USER })
  roles: UserRole[];

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date | null;

  @Column({ nullable: true, name: 'verification_token' })
  verificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'password_changed_at' })
  passwordChangedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'blocked_at' })
  blockedAt: Date | null;

  @Column({ default: 0, name: 'session_number' })
  sessionNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'logout_at' })
  logoutAt: Date | null;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @BeforeInsert()
  async beforeInsert() {
    await this.setDefaultRole();
    await this.encryptPassword();
  }

  async setDefaultRole() {
    if (!this.roles || this.roles.length === 0) {
      this.roles = [Role.USER];
    }
  }

  async encryptPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
}
