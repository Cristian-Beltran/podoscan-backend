// src/app/session/entities/session-data.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('session_data')
@Index('idx_session_data_recorded_at', ['recordedAt'])
export class SessionData {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Session, (s) => s.records, { onDelete: 'CASCADE' })
  session: Session;

  // Presión (piezo calibrado o voltaje)
  @Column('float') p1: number; // talón
  @Column('float') p2: number; // mediopié
  @Column('float') p3: number; // antepié
  @Column('float') p4?: number; // antepié 2
  @Column('float') p5?: number; // antepié 3

  // IMU (aceleración y giros)
  @Column('float') ax: number;
  @Column('float') ay: number;
  @Column('float') az: number;
  @Column('float') gx: number;
  @Column('float') gy: number;
  @Column('float') gz: number;

  @CreateDateColumn()
  recordedAt: Date;
}
