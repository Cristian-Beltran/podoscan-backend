// src/device/entities/device.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../users/entities/patient.entity';
import { Status } from '../../../context/shared/models/active.model';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  serialNumber: string;

  @Column()
  model: string;

  // Device tiene la foreign key - lado principal
  @OneToOne(() => Patient, (patient) => patient.device, {
    nullable: true, // Permite que no tenga paciente
    onDelete: 'SET NULL', // Opcional: cuando se elimine el paciente, setea null
  })
  @JoinColumn() // ← FOREIGN KEY ESTÁ AQUÍ
  patient?: Patient;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;
}
