// src/app/appoinment/controllers/appoinment.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AppoinmentService } from '../servicies/appoinment.service';
import { UpsertAppoinmentDto } from '../dtos/appoinment.dto';
import { EditAppoinmentPatientDataDto } from '../dtos/data-appoinment.dto';
import type { Appointment } from '../entities/appoinment.entity';

@UseGuards(JwtAuthGuard)
@Controller('appoinments')
export class AppoinmentController {
  constructor(private readonly appoinmentService: AppoinmentService) {}

  // helper: arma base URL desde la request (respeta proxies)
  private baseUrl(req: Request) {
    const proto =
      (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host =
      (req.headers['x-forwarded-host'] as string) ||
      (req.headers['host'] as string);
    return `${proto}://${host}`;
  }
  private absolutize(req: Request, appt: Appointment) {
    const base = this.baseUrl(req);
    const abs = (p?: string | null) =>
      !p ? p : p.startsWith('/') ? `${base}${p}` : `${base}/${p}`;
    return {
      ...appt,
      originalUrl: abs(appt.originalUrl),
      processedUrl: abs(appt.processedUrl),
    };
  }

  @Post()
  async create(@Body() dto: UpsertAppoinmentDto, @Req() req: Request) {
    const a = await this.appoinmentService.create(dto);
    return this.absolutize(req, a);
  }

  @Get()
  async findAll() {
    return this.appoinmentService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    const a = await this.appoinmentService.get(id);
    return this.absolutize(req, a);
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpsertAppoinmentDto,
    @Req() req: Request,
  ) {
    const a = await this.appoinmentService.update(id, dto);
    return this.absolutize(req, a);
  }

  @Get('by-patient/:patientId')
  async findByPatient(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Req() req: Request,
  ) {
    const list = await this.appoinmentService.findByPatient(patientId);
    return list.map((a) => this.absolutize(req, a));
  }

  @Patch(':id/patient-data')
  async editPatientData(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EditAppoinmentPatientDataDto,
    @Req() req: Request,
  ) {
    const a = await this.appoinmentService.editPatientData(id, dto);
    return this.absolutize(req, a);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const a = await this.appoinmentService.uploadPhoto(id, file);
    return this.absolutize(req, a);
  }
}
