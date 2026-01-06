import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
}

@Entity('audit_logs')
@Index('IDX_AUDIT_USER', ['userId'])
@Index('IDX_AUDIT_ENDPOINT', ['endpoint'])
@Index('IDX_AUDIT_STATUS', ['statusCode'])
@Index('IDX_AUDIT_CREATED', ['createdAt'])
@Index('IDX_AUDIT_TRACE', ['traceId'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // Request Information
  // ========================================

  @Column({ type: 'varchar', length: 10 })
  method: HttpMethod;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  queryParams: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  requestHeaders: Record<string, any> | null;

  // ========================================
  // Response Information
  // ========================================

  @Column({ type: 'smallint' })
  statusCode: number;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: Record<string, any> | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage: string | null;

  // ========================================
  // User & Authentication
  // ========================================

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userType: string | null; // 'citizen', 'admin', 'internal_user'

  @Column({ type: 'text', nullable: true })
  accessToken: string | null;

  // ========================================
  // Client Information
  // ========================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  clientIp: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string | null;

  // ========================================
  // Performance & Tracing
  // ========================================

  @Column({ type: 'int' })
  durationMs: number; // Response time in milliseconds

  @Column({ type: 'varchar', length: 100, nullable: true })
  traceId: string | null; // OpenTelemetry trace ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  spanId: string | null;

  // ========================================
  // Additional Context
  // ========================================

  @Column({ type: 'varchar', length: 50, nullable: true })
  apiVersion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  controllerName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionName: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Any extra data

  // ========================================
  // Timestamps
  // ========================================

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
