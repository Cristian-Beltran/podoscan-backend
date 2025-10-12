// module device

import { Device } from './entities/device.entity';
import { DeviceService } from './servicies/device.service';
import { DeviceController } from './api/device.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device]), UsersModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
