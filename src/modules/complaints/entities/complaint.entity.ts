import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { ComplaintAuthority } from '../enums/complaint-authority.enum';
import { ComplaintCategory } from '../enums/complaint-category.enum';
import { ComplaintStatus } from '../enums/complaint-status.enum';

@Entity('your-bucket-name')
export class ComplaintEntity {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ name: 'citizen_id' })
  citizenId: number;

  @Column({ name: 'locked_by_internal_user_id', nullable: true })
  lockedByInternalUserId: number | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => CitizenEntity, { nullable: false })
  @JoinColumn({ name: 'citizen_id' })
  citizen: CitizenEntity;
}
