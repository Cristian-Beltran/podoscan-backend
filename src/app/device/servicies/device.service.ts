// src/app/device/device.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import {
  LinkDevicePatientDto,
  UpdateDeviceDto,
  CreateDeviceDto,
} from '../dtos/device.dto';
import { PatientService } from 'src/app/users/services/patient.service';
import { Status } from 'src/context/shared/models/active.model';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    private readonly patientService: PatientService,
  ) {}

  async create(dto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepo.create({
      serialNumber: dto.serialNumber,
      model: dto.model,
    });

    if (dto.patientId) {
      const patient = await this.patientService.findOneOrThrow(dto.patientId);
      device.patient = patient;
    }

    const saved = await this.deviceRepo.save(device);
    return this.findOne(saved.id);
  }

  findAll(): Promise<Device[]> {
    return this.deviceRepo.find({ relations: ['patient', 'patient.user'] });
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      relations: ['patient', 'patient.user'],
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    if (dto.serialNumber !== undefined) device.serialNumber = dto.serialNumber;
    if (dto.model !== undefined) device.model = dto.model;

    await this.deviceRepo.save(device);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!device) return;
    device.status = Status.DELETED;
    device.patient = null;
    await this.deviceRepo.save(device);
  }

  async link({ deviceId, patientId }: LinkDevicePatientDto): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: ['patient'],
    });
    if (!device) throw new NotFoundException('Device not found');
    const patient = await this.patientService.findOneOrThrow(patientId);
    device.patient = patient;
    await this.deviceRepo.save(device);
    return this.findOne(device.id);
  }

  async unlink(deviceId: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({
      where: { id: deviceId },
      relations: ['patient'],
    });
    if (!device) throw new NotFoundException('Device not found');

    if (device.patient) {
      const pid = device.patient.id;
      device.patient = null;
      await this.deviceRepo.save(device);
    }
    return this.findOne(device.id);
  }
}
