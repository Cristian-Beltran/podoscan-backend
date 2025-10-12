// src/app/user/entities/family-member.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Patient } from './patient.entity';

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @ManyToMany(() => Patient, (patient) => patient.familyMembers)
  @JoinTable({ name: 'family_patients' })
  patients: Patient[];
}
