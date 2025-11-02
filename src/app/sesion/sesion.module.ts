import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { SessionData } from './entities/session-data.entity';
import { SessionController } from './api/session.controller';
import { SessionService } from './services/session.service';
import { Device } from '../device/entities/device.entity';
import { Patient } from '../users/entities/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionData, Device, Patient])],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SesionModule {}
