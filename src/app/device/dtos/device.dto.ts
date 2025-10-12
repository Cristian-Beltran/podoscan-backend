// src/app/device/dto/create-device.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  // opcionalmente crear ya asignado
  @IsOptional()
  @IsUUID()
  patientId?: string;
}

import { PartialType } from '@nestjs/mapped-types';
export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}

export class LinkDevicePatientDto {
  @IsUUID() deviceId: string;
  @IsUUID() patientId: string;
}

export class UnlinkDeviceDto {
  @IsUUID() deviceId: string;
}
