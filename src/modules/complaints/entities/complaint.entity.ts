import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { InternalUserEntity } from '../../internal-users/entities/internal-user.entity';
import { ComplaintAuthority } from '../enums/complaint-authority.enum';
import { ComplaintCategory } from '../enums/complaint-category.enum';
import { ComplaintPriority } from '../enums/complaint-priority.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';

@Entity('your-bucket-name')
export class ComplaintEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'reference_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  referenceNumber: string;

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
    enum: ComplaintPriority,
    enumName: 'complaint_priority_enum',
    default: ComplaintPriority.MEDIUM,
  })
  priority: ComplaintPriority;

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
    name: 'location_text',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  locationText: string | null;

  @Column({
    type: 'double precision',
    nullable: true,
  })
  latitude: number | null;

  @Column({
    type: 'double precision',
    nullable: true,
  })
  longitude: number | null;

  @Column('text', { array: true, default: '{}' })
  attachments: string[];

  @ManyToOne(() => CitizenEntity, { nullable: false })
  @JoinColumn({ name: 'citizen_id' })
  citizen: CitizenEntity;

  @Column({ name: 'citizen_id' })
  citizenId: number;

  @ManyToOne(() => InternalUserEntity, { nullable: true })
  @JoinColumn({ name: 'assigned_to_internal_user_id' })
  assignedToInternalUser: InternalUserEntity | null;

  @Column({ name: 'assigned_to_internal_user_id', nullable: true })
  assignedToInternalUserId: number | null;

  @Column({ name: 'locked_by_internal_user_id', nullable: true })
  lockedByInternalUserId: number | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
