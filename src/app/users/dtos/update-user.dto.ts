import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateMyProfileDto {
  @IsString()
  @IsNotEmpty()
  fullname?: string;
  @IsString()
  @IsOptional()
  address?: string;
}
