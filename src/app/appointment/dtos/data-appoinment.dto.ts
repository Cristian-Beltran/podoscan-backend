// src/app/appointment/dtos/data-appoinment.dto.ts
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EditAppoinmentPatientDataDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  contactTotalPct?: number;

  @IsOptional()
  @IsNumber()
  forefootPct?: number;

  @IsOptional()
  @IsNumber()
  midfootPct?: number;

  @IsOptional()
  @IsNumber()
  rearfootPct?: number;

  // 👉 Nuevos campos
  @IsOptional()
  @IsNumber()
  forefootWidthMm?: number; // a

  @IsOptional()
  @IsNumber()
  isthmusWidthMm?: number; // b

  @IsOptional()
  @IsNumber()
  chippauxSmirakIndex?: number; // (b/a)*100 o b/a según convención que manejes
}
