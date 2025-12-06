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
import { Status } from 'src/context/shared/models/active.model';

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
      where: { serialNumber: dto.serialNumber, status: Status.ACTIVE },
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
    const sessions = await this.sessionRepo.find({
      where: { patient: { user: { id: patientId } } },
      order: { startedAt: 'DESC' },
      relations: ['patient', 'device', 'records'],
    });

    if (sessions.length === 0) return [];

    return sessions.map((s) => {
      // Ordenar los records por fecha DESC (nuevo → antiguo)
      const orderedRecords = [...s.records].sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      );
      return {
        ...s,
        records: orderedRecords.map((r) => ({
          ...r,
          p1: this.voltageToKg(r.p1),
          p2: this.voltageToKg(r.p2),
          p3: this.voltageToKg(r.p3),
          p4: this.voltageToKg(r.p4),
          p5: this.voltageToKg(r.p5),
        })),
      };
    });
  }

  // utils/fsr-conversion.ts
  voltageToKg(vout: number): number {
    const VCC = 3.3;
    const R_FIXED = 10_000;
    if (vout <= 0) return 0;

    // calcula Rsensor según divisor
    const Rs = R_FIXED * ((VCC - vout) / vout);

    // modelo derivado del SEN0295
    const a = 8.7e7;
    const b = 1.54;
    const kg = a * Math.pow(Rs, -b);

    // límites
    return Math.max(0, Math.min(kg, 6));
  }
}
