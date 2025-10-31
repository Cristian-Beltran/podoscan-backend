// src/app/appoinment/dto/edit-appoinment-patient-data.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EditAppoinmentPatientDataDto {
  @IsOptional()
  @IsNumber()
  contactTotalPct?: number; // default 0 en entidad

  @IsOptional()
  @IsNumber()
  forefootPct?: number; // default 0 en entidad

  @IsOptional()
  @IsNumber()
  midfootPct?: number; // default 0 en entidad

  @IsOptional()
  @IsNumber()
  rearfootPct?: number; // default 0 en entidad

  @IsOptional()
  @IsString()
  note?: string; // nota clínica del doctor
}
