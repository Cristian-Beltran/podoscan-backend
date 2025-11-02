// src/app/session/services/session.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { SessionData } from '../entities/session-data.entity';
import { Device } from '../../device/entities/device.entity';
import { Patient } from 'src/app/users/entities/patient.entity';
import { IngestSessionDto } from '../dtos/session-data.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(SessionData)
    private readonly dataRepo: Repository<SessionData>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  private readonly TZ = 'America/La_Paz'; // ajusta si aplica

  private async getOrCreateTodaySession(patient: Patient, device: Device) {
    // Busca la sesión del "día local" en TZ elegida, pero comparando en UTC
    let session = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.patient', 'patient')
      .leftJoinAndSelect('s.device', 'device')
      .where('s.patientId = :patientId', { patientId: patient.id })
      .andWhere('s.deviceId = :deviceId', { deviceId: device.id })
      // ventana del día (TZ) convertida a UTC:
      .andWhere(
        `s.startedAt >= timezone('UTC', date_trunc('day', now() at time zone :tz))`,
        { tz: this.TZ },
      )
      .andWhere(
        `s.startedAt <  timezone('UTC', date_trunc('day', (now() at time zone :tz) + interval '1 day'))`,
        { tz: this.TZ },
      )
      .getOne();

    if (!session) {
      session = this.sessionRepo.create({
        patient,
        device,
        startedAt: new Date(), // imprescindible
      });
      session = await this.sessionRepo.save(session);
      session = await this.sessionRepo.findOneOrFail({
        where: { id: session.id },
        relations: ['patient', 'device'],
      });
    }
    return session;
  }

  /**
   * Ingesta cruda (1 registro por request):
   * - Busca device por serial.
   * - Valida que tenga patient asignado.
   * - Reusa o crea la sesión del día (patient+device).
   * - Inserta 1 SessionData.
   * Devuelve: sesión (ids clave) + record insertado (crudo).
   */
  async ingest(dto: IngestSessionDto) {
    if (!dto?.serialNumber) {
      throw new BadRequestException('deviceSerial requerido');
    }

    const device = await this.deviceRepo.findOne({
      where: { serialNumber: dto.serialNumber },
      relations: ['patient'],
    });
    if (!device) throw new NotFoundException('Device no encontrado');
    if (!device.patient)
      throw new BadRequestException('Device sin paciente asignado');

    const session = await this.getOrCreateTodaySession(device.patient, device);

    const record = this.dataRepo.create({
      session,
      // presión
      p1: dto.p1,
      p2: dto.p2,
      p3: dto.p3,
      p4: dto.p4,
      p5: dto.p5,
      // IMU
      ax: dto.ax,
      ay: dto.ay,
      az: dto.az,
      gx: dto.gx,
      gy: dto.gy,
      gz: dto.gz,
    });

    const saved = await this.dataRepo.save(record);

    return {
      session: {
        id: session.id,
        patient: { id: session.patient.id },
        device: { id: session.device.id, serialNumber: device.serialNumber },
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
      },
      record: saved,
    };
  }
  async listAllByPatient(patientId: string) {
    // Trae sesiones del paciente (con device/patient por si quieres mostrar en UI)
    const sessions = await this.sessionRepo.find({
      where: { patient: { id: patientId } },
      order: { startedAt: 'DESC' },
      relations: ['patient', 'device', 'records'],
    });

    if (sessions.length === 0) {
      // puedes retornar [] en lugar de lanzar si prefieres
      return [];
    }
    return sessions;
  }
}
