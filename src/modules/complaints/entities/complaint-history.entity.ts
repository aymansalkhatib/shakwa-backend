import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { ComplaintAuthority } from '../enums/complaint-authority.enum';
import { ComplaintCategory } from '../enums/complaint-category.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';
import { ComplaintEntity } from './complaint.entity';

@Entity('complaint_histories')
export class ComplaintHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'internal_user_id', type: 'int', nullable: true })
  internalUserId: number | null;

  @Column({ name: 'complaint_id' })
  complaintId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    enumName: 'complaint_status_enum',
    default: ComplaintStatus.NEW,
  })
  status: ComplaintStatus;

  @Column({
    type: 'enum',
    enum: ComplaintCategory,
    enumName: 'complaint_category_enum',
    default: ComplaintCategory.GENERAL_SERVICE,
  })
  category: ComplaintCategory;

  @Column({
    type: 'enum',
    enum: ComplaintAuthority,
    enumName: 'complaint_authority_enum',
  })
  authority: ComplaintAuthority;

  @Column({
    name: 'location',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  location: string | null;

  @Column('text', { array: true, default: '{}' })
  attachments: string[];

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ComplaintEntity, { nullable: false })
  @JoinColumn({ name: 'complaint_id' })
  complaint: ComplaintEntity;

  @ManyToOne(() => InternalUserEntity, { nullable: true })
  @JoinColumn({ name: 'internal_user_id' })
  internalUser: InternalUserEntity;
}
