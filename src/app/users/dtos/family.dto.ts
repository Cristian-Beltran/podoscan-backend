import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { CreateUserBaseDto } from './user.dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFamilyMemberDto extends CreateUserBaseDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  patientIds?: string[]; // lista de pacientes que va a monitorear
}
