// src/app/appoinment/dto/upsert-appoinment.dto.ts
import { IsUUID, IsDateString } from 'class-validator';

export class UpsertAppoinmentDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  // ISO 8601 (ej: "2025-10-12T14:30:00Z" o con TZ local)
  @IsDateString()
  appointmentAt: string;
}
