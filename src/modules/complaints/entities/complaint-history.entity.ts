import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { ComplaintEntity } from './complaint.entity';

@Index('idx_complaint_history_complaint_id', ['complaintId'])
@Index('idx_complaint_history_internal_user_id', ['internalUserId'])
@Index('idx_complaint_history_created_at', ['createdAt'])
@Entity('complaint_histories')
export class ComplaintHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'internal_user_id', type: 'int', nullable: true })
  internalUserId: number | null;

  @Column({ name: 'complaint_id', type: 'int' })
  complaintId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.NEW,
  })
  status: ComplaintStatus;

  @Column({
    name: 'location',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  location: string | null;

  @Column('text', { array: true, default: '{}' })
  attachments: string[];

  @Column({ name: 'citizen_note', type: 'text', nullable: true })
  citizenNote: string | null;

  @Column({ name: 'internal_user_note', type: 'text', nullable: true })
  internalUserNote: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => InternalUserEntity, (internalUser) => internalUser.complaintHistories, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'internal_user_id' })
  internalUser: InternalUserEntity | null;

  @ManyToOne(() => ComplaintEntity, (complaint) => complaint.histories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'complaint_id' })
  complaint: ComplaintEntity;
}
