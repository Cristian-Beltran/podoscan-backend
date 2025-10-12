// src/app/session/entities/session-data.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('session_data')
export class SessionData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Session, (session) => session.records)
  session: Session;

  @Column('float')
  lungCapacity: number; // voltajes +/- convertidos a valor clínico

  @Column('int')
  pulse: number;

  @Column('int')
  oxygenSaturation: number;

  @CreateDateColumn()
  recordedAt: Date;
}
