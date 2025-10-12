// src/app/session/entities/session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Patient } from '../../users/entities/patient.entity';
import { Device } from '../../device/entities/device.entity';
import { SessionData } from './session-data.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { eager: true })
  patient: Patient;

  @ManyToOne(() => Device, { eager: true })
  device: Device;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  @OneToMany(() => SessionData, (data) => data.session, { cascade: true })
  records: SessionData[];
}
