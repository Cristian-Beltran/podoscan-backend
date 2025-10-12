// src/app/user/dto/create-doctor.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { CreateUserBaseDto } from './user.dto';

export class CreateDoctorDto extends CreateUserBaseDto {
  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  licenseNumber?: string;
}
