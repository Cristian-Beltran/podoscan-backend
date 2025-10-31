// src/app/session/dtos/ingest.dto.ts
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestSessionDto {
  @IsString()
  serialNumber: string;

  // Presión
  @IsNumber() p1: number; // talón
  @IsNumber() p2: number; // mediopié
  @IsNumber() p3: number; // antepié
  @IsNumber() p4: number; // antepié
  @IsNumber() p5: number; // antepié

  // IMU
  @IsNumber() ax: number;
  @IsNumber() ay: number;
  @IsNumber() az: number;
  @IsNumber() gx: number;
  @IsNumber() gy: number;
  @IsNumber() gz: number;

  // opcional; si no llega, se usa now()
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
