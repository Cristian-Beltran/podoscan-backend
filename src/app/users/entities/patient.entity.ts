// src/app/user/entities/patient.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { User } from './user.entity';
import { FamilyMember } from './family.entity';
import { Device } from '../../device/entities/device.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @ManyToMany(() => FamilyMember, (family) => family.patients)
  familyMembers: FamilyMember[];

  // Solo referencia inversa - SIN @JoinColumn()
  @OneToOne(() => Device, (device) => device.patient, {
    nullable: true, // También nullable aquí
  })
  device?: Device;
}
