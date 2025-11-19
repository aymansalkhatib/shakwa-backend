import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { ComplaintEntity } from './complaint.entity';

@Entity('complaint_histories')
export class ComplaintHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ComplaintEntity, { nullable: false })
  @JoinColumn({ name: 'complaint_id' })
  complaint: ComplaintEntity;

  @Column({ name: 'complaint_id' })
  complaintId: number;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ComplaintStatus,
    enumName: 'complaint_status_enum',
    nullable: true,
  })
  fromStatus: ComplaintStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ComplaintStatus,
    enumName: 'complaint_status_enum',
    nullable: true,
  })
  toStatus: ComplaintStatus | null;

  @Column({
    name: 'changed_by_role',
    type: 'varchar',
    length: 50,
  })
  changedByRole: Role;

  @Column({ name: 'changed_by_citizen_id', nullable: true })
  changedByCitizenId: number | null;

  @Column({ name: 'changed_by_internal_user_id', nullable: true })
  changedByInternalUserId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
