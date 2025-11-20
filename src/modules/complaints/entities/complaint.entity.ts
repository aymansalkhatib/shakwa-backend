import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';

@Entity('your-bucket-name')
export class ComplaintEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
