// src/app/user/services/doctor.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { CreateDoctorDto } from '../dtos/doctor.dto';
import { UserBaseService } from './users.service';
import { UserType } from '../enums/user-type';
import { Status } from '../../../context/shared/models/active.model';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    private readonly userBaseService: UserBaseService,
  ) {}

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    dto.type = UserType.DOCTOR;
    dto.status = Status.ACTIVE;

    const user = await this.userBaseService.createUser({
      fullname: dto.fullname,
      email: dto.email,
      address: dto.address,
      password: dto.password,
      type: UserType.PATIENT,
      status: Status.ACTIVE,
    });
    const doctor = this.doctorRepository.create({
      user,
      specialty: dto.specialty,
      licenseNumber: dto.licenseNumber,
    });
    return this.doctorRepository.save(doctor);
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['user'],
      where: { user: { status: Not(Status.DELETED) } },
    });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    return doctor;
  }

  async update(id: string, dto: Partial<CreateDoctorDto>): Promise<Doctor> {
    const doctor = await this.findOne(id);

    await this.userBaseService.updateUser(doctor.user.id, {
      fullname: dto.fullname,
      email: dto.email,
      address: dto.address,
    });

    Object.assign(doctor, {
      specialty: dto.specialty ?? doctor.specialty,
      licenseNumber: dto.licenseNumber ?? doctor.licenseNumber,
    });

    await this.doctorRepository.save(doctor);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.userBaseService.removeUser(doctor.user.id);
  }

  async findByEmail(email: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { email } },
      relations: ['user'],
    });
    return doctor;
  }

  async updateStatus(id: string, status: Status): Promise<Doctor> {
    await this.userBaseService.updateStatus(id, status);
    return await this.findOne(id);
  }
}
