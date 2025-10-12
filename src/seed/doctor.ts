import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app/app.module';
import { CreateDoctorDto } from '../app/users/dtos/doctor.dto';
import { Logger } from '@nestjs/common';
import { DoctorService } from 'src/app/users/services/doctor.service';
import { UserType } from 'src/app/users/enums/user-type';
import { Status } from 'src/context/shared/models/active.model';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(DoctorService);
  const logger = new Logger('Seeder');

  const email = 'admin@clinic.com';
  const exists = await userService.findByEmail(email);

  if (exists) {
    logger.warn(`Ya existe un usuario clínico con el correo ${email}`);
    return app.close();
  }

  const dto: CreateDoctorDto = {
    fullname: 'Doctor admin',
    email: 'admin@clinic.com',
    password: 'admin123',
    type: UserType.DOCTOR,
    status: Status.ACTIVE,
    specialty: 'General',
    licenseNumber: '123123',
  };

  try {
    await userService.create(dto);
    logger.log(`✅  Usuario clínico admin creado con correo: ${email}`);
  } catch (error) {
    logger.error('❌  Error al crear el usuario de clínica admin', error);
  } finally {
    await app.close();
  }
}

bootstrap();
