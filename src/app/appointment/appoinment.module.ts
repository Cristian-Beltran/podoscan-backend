import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appoinment.entity';
import { AppoinmentController } from './api/appointment.controller';
import { AppoinmentService } from './servicies/appoinment.service';
import { UsersModule } from '../users/user.module';
import { IaService } from './servicies/ia.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment]), UsersModule],
  controllers: [AppoinmentController],
  providers: [AppoinmentService, IaService],
})
export class AppointmentModule {}
