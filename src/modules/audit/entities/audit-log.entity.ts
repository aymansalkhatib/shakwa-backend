import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index('idx_audit_user_id', ['userId'])
@Index('idx_audit_user_type', ['userType'])
@Index('idx_audit_action', ['action'])
@Index('idx_audit_timestamp', ['timestamp'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  userType: string; // 'citizen', 'admin', 'staff', 'anonymous'

  @Column({ type: 'varchar', length: 10 })
  method: string; // GET, POST, PUT, DELETE, etc.

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action: string; // Descriptive action like "GET /api/v1/your-bucket-name"

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'int', nullable: true })
  responseTime: number; // in milliseconds

  @Column({ type: 'jsonb', nullable: true })
  requestBody: any;

  @Column({ type: 'jsonb', nullable: true })
  queryParams: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional context

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;
}
