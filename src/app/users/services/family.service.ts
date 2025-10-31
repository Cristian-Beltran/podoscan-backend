// src/app/user/services/family-member.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { FamilyMember } from '../entities/family.entity';
import { CreateFamilyMemberDto } from '../dtos/family.dto';
import { UserBaseService } from './users.service';
import { UserType } from '../enums/user-type';
import { Status } from 'src/context/shared/models/active.model';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class FamilyMemberService {
  constructor(
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly userBaseService: UserBaseService,
  ) {}

  async create(dto: CreateFamilyMemberDto): Promise<FamilyMember> {
    dto.type = UserType.FAMILY;
    dto.status = Status.ACTIVE;

    const user = await this.userBaseService.createUser({
      fullname: dto.fullname,
      email: dto.email,
      password: dto.password,
      // OJO: revisa si aquí realmente debe ser PATIENT o FAMILY
      type: UserType.PATIENT,
      address: dto.address,
      status: Status.ACTIVE,
    });

    // Normaliza ids
    const ids = Array.isArray(dto.patientsId)
      ? dto.patientsId
      : dto.patientsId !== undefined && dto.patientsId !== null
        ? [dto.patientsId] // venía simple → lo hacemos array
        : [];

    const patients = ids.length
      ? await this.patientRepository.findBy({ id: In(ids) })
      : [];

    const family = this.familyMemberRepository.create({
      user,
      patients, // puede ir vacío; o si tu modelo lo requiere, valida y lanza 400
    });
    return this.familyMemberRepository.save(family);
  }

  async findAll(): Promise<FamilyMember[]> {
    return this.familyMemberRepository.find({
      relations: ['user', 'patients'],
      where: { user: { status: Not(Status.DELETED) } },
    });
  }

  async findOne(id: string): Promise<FamilyMember> {
    const family = await this.familyMemberRepository.findOne({
      where: { user: { id } },
      relations: ['user', 'patients'],
    });
    if (!family) throw new NotFoundException(`FamilyMember ${id} not found`);
    return family;
  }

  async update(
    id: string,
    dto: Partial<CreateFamilyMemberDto>,
  ): Promise<FamilyMember> {
    const family = await this.findOne(id);

    await this.userBaseService.updateUser(family.user.id, {
      fullname: dto.fullname,
      email: dto.email,
      address: dto.address,
    });

    if (dto.patientsId && dto.patientsId.length > 0) {
      const patients = await this.patientRepository.find({
        where: { id: In(dto.patientsId) },
      });
      family.patients = patients;
    }

    return this.familyMemberRepository.save(family);
  }

  async remove(id: string): Promise<void> {
    const family = await this.findOne(id);
    await this.userBaseService.removeUser(family.user.id);
  }

  async updateStatus(id: string, status: Status): Promise<FamilyMember> {
    await this.userBaseService.updateStatus(id, status);
    return await this.findOne(id);
  }
}
