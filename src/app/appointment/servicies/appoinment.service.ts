// src/app/appointment/services/appointment.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientService } from '../../users/services/patient.service';
import { DoctorService } from '../../users/services/doctor.service';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { Appointment } from '../entities/appoinment.entity';
import { UpsertAppoinmentDto } from '../dtos/appoinment.dto';
import { EditAppoinmentPatientDataDto } from '../dtos/data-appoinment.dto';
import { IaService } from './ia.service'; // <<—— IA

@Injectable()
export class AppoinmentService {
  private readonly IMG_DIR = join(process.cwd(), 'src', 'context', 'img');
  private readonly PUBLIC_PREFIX = '/img';

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    private readonly patientService: PatientService,
    private readonly doctorService: DoctorService,
    private readonly ia: IaService, // <<—— inject IA
  ) {}

  private ensureImgDir() {
    if (!existsSync(this.IMG_DIR)) mkdirSync(this.IMG_DIR, { recursive: true });
  }

  private genFilename(originalName?: string, suffix?: string) {
    const ext = (originalName && extname(originalName)) || '.png';
    const stamp = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return suffix ? `${stamp}-${suffix}${ext}` : `${stamp}${ext}`;
  }

  private savePhotoToLocal(file: Express.Multer.File): string {
    if (!file?.buffer)
      throw new BadRequestException('Photo buffer not provided');
    this.ensureImgDir();
    const filename = this.genFilename(file.originalname, 'orig');
    const filePath = join(this.IMG_DIR, filename);
    writeFileSync(filePath, file.buffer);
    return `${this.PUBLIC_PREFIX}/${filename}`;
  }

  private saveBufferToLocalPNG(buf: Buffer, originalName?: string): string {
    this.ensureImgDir();
    const filename = this.genFilename(originalName, 'bw'); // sufijo bw
    const filePath = join(this.IMG_DIR, filename);
    writeFileSync(filePath, buf);
    return `${this.PUBLIC_PREFIX}/${filename}`;
  }

  // ----------------- CRUD básico citas (igual que ya lo tienes) -----------------
  async create(dto: UpsertAppoinmentDto): Promise<Appointment> {
    const patient = await this.patientService.findOne(dto.patientId);
    const doctor = await this.doctorService.findOne(dto.doctorId);
    if (!patient) throw new NotFoundException('Patient not found');
    if (!doctor) throw new NotFoundException('Doctor not found');

    const entity = this.repo.create({
      appointmentAt: new Date(dto.appointmentAt),
      patient,
      doctor,
    });
    return this.repo.save(entity);
  }

  async findAll(id): Promise<Appointment[]> {
    return this.repo.find({
      relations: ['patient.user', 'doctor.user'],
      where: { doctor: { user: { id } } },
    });
  }

  async update(id: string, dto: UpsertAppoinmentDto): Promise<Appointment> {
    const appt = await this.get(id);
    const patient = await this.patientService.findOne(dto.patientId);
    const doctor = await this.doctorService.findOne(dto.doctorId);
    if (!patient) throw new NotFoundException('Patient not found');
    if (!doctor) throw new NotFoundException('Doctor not found');

    appt.appointmentAt = new Date(dto.appointmentAt);
    appt.patient = patient;
    appt.doctor = doctor;
    return this.repo.save(appt);
  }

  async editPatientData(
    id: string,
    dto: EditAppoinmentPatientDataDto,
  ): Promise<Appointment> {
    const appt = await this.get(id);

    if (dto.note !== undefined) appt.note = dto.note;
    if (dto.contactTotalPct !== undefined)
      appt.contactTotalPct = dto.contactTotalPct;
    if (dto.forefootPct !== undefined) appt.forefootPct = dto.forefootPct;
    if (dto.midfootPct !== undefined) appt.midfootPct = dto.midfootPct;
    if (dto.rearfootPct !== undefined) appt.rearfootPct = dto.rearfootPct;
    if (dto.forefootWidthMm !== undefined)
      appt.forefootWidthMm = dto.forefootWidthMm;

    if (dto.isthmusWidthMm !== undefined)
      appt.isthmusWidthMm = dto.isthmusWidthMm;

    if (dto.chippauxSmirakIndex !== undefined)
      appt.chippauxSmirakIndex = dto.chippauxSmirakIndex;

    return this.repo.save(appt);
  }

  async findByPatient(id: string): Promise<Appointment[]> {
    return this.repo.find({ where: { patient: { user: { id } } } });
  }

  // ----------------- Upload con IA -----------------

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
  ): Promise<Appointment> {
    if (!file) throw new BadRequestException('File not provided');

    const appt = await this.get(id);

    const originalUrl = this.savePhotoToLocal(file);
    let processedUrl = originalUrl;

    try {
      // 1️⃣ Generar mapa / heatmap
      const pressureMap = await this.ia.footPressureMap(file);
      processedUrl = this.saveBufferToLocalPNG(pressureMap, file.originalname);

      // 2️⃣ Analizar con GPT (porcentajes + geometría)
      const analysis = await this.ia.analyzeFootPressure(pressureMap);

      appt.contactTotalPct = analysis.contactTotalPct;
      appt.forefootPct = analysis.forefootPct;
      appt.midfootPct = analysis.midfootPct;
      appt.rearfootPct = analysis.rearfootPct;
      appt.note = analysis.note;

      // 👉 nuevos campos
      if (analysis.forefootWidthMm !== undefined)
        appt.forefootWidthMm = analysis.forefootWidthMm;

      if (analysis.isthmusWidthMm !== undefined)
        appt.isthmusWidthMm = analysis.isthmusWidthMm;

      if (analysis.chippauxSmirakIndex !== undefined)
        appt.chippauxSmirakIndex = analysis.chippauxSmirakIndex;
    } catch (e) {
      console.error('Error en análisis IA:', e);
    }

    appt.originalUrl = originalUrl;
    appt.processedUrl = processedUrl;

    return this.repo.save(appt);
  }

  // ----------------- Utilidades -----------------
  async get(id: string): Promise<Appointment> {
    const appt = await this.repo.findOne({
      where: { id },
      relations: ['patient.user', 'doctor.user'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }
}
