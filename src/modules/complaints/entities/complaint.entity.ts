import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { ComplaintAuthority, ComplaintCategory } from '../enums';
import { ComplaintHistoryEntity } from './complaint-history.entity';
import { ComplaintLockerRole } from '../enums/complaint-locker-role.enum';

@Entity('your-bucket-name')
@Index('idx_complaint_authority', ['authority'])
@Index('idx_complaint_citizen_id', ['citizenId'])
@Index('idx_complaint_category', ['category'])
@Index('idx_complaint_created_at', ['createdAt'])
export class ComplaintEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'citizen_id', type: 'int' })
  citizenId: number;

  @Column({
    type: 'enum',
    enum: ComplaintCategory,
  })
  category: ComplaintCategory;

  @Column({
    type: 'enum',
    enum: ComplaintAuthority,
  })
  authority: ComplaintAuthority;

  @Column({
    type: 'enum',
    enum: ComplaintLockerRole,
    nullable: true,
    name: 'locked_by_role',
  })
  lockedByRole: ComplaintLockerRole | null;

  @Column({ name: 'locked_by_id', type: 'int', nullable: true })
  lockedById: number | null;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => CitizenEntity, { nullable: false })
  @JoinColumn({ name: 'citizen_id' })
  citizen: CitizenEntity;

  @OneToMany(() => ComplaintHistoryEntity, (history) => history.complaint)
  histories: ComplaintHistoryEntity[];
}
