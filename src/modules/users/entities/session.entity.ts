import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sessions, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'session_number', nullable: false })
  sessionNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'refresh_token' })
  @IsNotEmpty()
  refreshToken: string;

  @BeforeInsert()
  async beforeInsert() {
    await this.encryptPassword();
  }

  async encryptPassword() {
    if (this.refreshToken) {
      this.refreshToken = await bcrypt.hash(this.refreshToken, 12);
    }
  }
}
