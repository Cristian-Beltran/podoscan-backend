// src/app/device/device.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DeviceService } from '../servicies/device.service';

import {
  UnlinkDeviceDto,
  LinkDevicePatientDto,
  UpdateDeviceDto,
  CreateDeviceDto,
} from '../dtos/device.dto';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.deviceService.create(dto);
  }

  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.deviceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(id);
  }

  // ÚNICO flujo de vínculo
  @Post('link')
  link(@Body() dto: LinkDevicePatientDto) {
    return this.deviceService.link(dto);
  }

  @Post('unlink')
  unlink(@Body() dto: UnlinkDeviceDto) {
    return this.deviceService.unlink(dto.deviceId);
  }
}
