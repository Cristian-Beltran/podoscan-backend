// src/app/appoinment/entities/appoinment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Patient } from '../../users/entities/patient.entity';
import { Doctor } from '../../users/entities/doctor.entity';

export type FootSide = 'left' | 'right' | 'both';

@Entity('appoinment')
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'timestamp' }) appointmentAt: Date;

  @Column({ nullable: true }) originalUrl?: string;
  @Column({ nullable: true }) processedUrl?: string;

  // Métricas calculadas (como las que generamos)
  @Column('float', { default: 0 }) contactTotalPct?: number;
  @Column('float', { default: 0 }) forefootPct?: number;
  @Column('float', { default: 0 }) midfootPct?: number;
  @Column('float', { default: 0 }) rearfootPct?: number;

  // 👉 Nuevo: métricas de ancho para índice Chippaux-Smirak
  @Column('float', { nullable: true })
  forefootWidthMm?: number; // a = ancho del antepié (mm)

  @Column('float', { nullable: true })
  isthmusWidthMm?: number; // b = ancho del istmo (mm)

  @Column('float', { nullable: true })
  chippauxSmirakIndex?: number;
  // convención: porcentaje = (b / a) * 100

  // Nota clínica del doctor acerca de la cita
  @Column({ type: 'text', nullable: true }) note?: string;

  @CreateDateColumn() createdAt: Date;

  @ManyToOne(
    () => Patient,
    (patient) => {
      patient.appointments;
    },
  )
  patient: Patient;

  @ManyToOne(
    () => Doctor,
    (doctor) => {
      doctor.appointments;
    },
  )
  doctor: Doctor;
}
