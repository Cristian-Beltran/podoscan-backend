import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/app/users/entities/user.entity';
import { FamilyMemberController } from './api/family.controller';
import { DoctorController } from './api/doctor.controller';
import { PatientController } from './api/patient.controller';
import { UserBaseService } from './services/users.service';
import { FamilyMemberService } from './services/family.service';
import { DoctorService } from './services/doctor.service';
import { PatientService } from './services/patient.service';
import { Doctor } from './entities/doctor.entity';
import { FamilyMember } from './entities/family.entity';
import { Patient } from './entities/patient.entity';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Doctor, FamilyMember, Patient])],
  controllers: [FamilyMemberController, DoctorController, PatientController],
  providers: [
    UserBaseService,
    FamilyMemberService,
    DoctorService,
    PatientService,
  ],
  exports: [
    UserBaseService,
    FamilyMemberService,
    DoctorService,
    PatientService,
  ],
})
export class UsersModule {}
