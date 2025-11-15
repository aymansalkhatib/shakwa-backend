import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('citizens')
export class CitizenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  // @OneToMany(() => Complaint, (complaint) => complaint.citizen)
  // your-bucket-name: Complaint[];

  @Column({ type: 'timestamp', nullable: true })
  blockedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
