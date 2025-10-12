// src/app/user/controllers/doctor.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
  Put,
  Patch,
} from '@nestjs/common';
import { DoctorService } from '../services/doctor.service';
import { CreateDoctorDto } from '../dtos/doctor.dto';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';
import { Status } from 'src/context/shared/models/active.model';

@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}
  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.create(dto);
  }
  @Get()
  findAll() {
    return this.doctorService.findAll();
  }
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctorService.findOne(id);
  }
  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: Partial<CreateDoctorDto>,
  ) {
    return this.doctorService.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctorService.remove(id);
  }
  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: { status: Status },
  ) {
    return this.doctorService.updateStatus(id, dto.status);
  }
}
