// src/app/user/services/family-member.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { FamilyMember } from '../entities/family.entity';
import { CreateFamilyMemberDto } from '../dtos/family.dto';
import { UserBaseService } from './users.service';
import { UserType } from '../enums/user-type';
import { Status } from '../../../context/shared/models/active.model';
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
      type: UserType.PATIENT,
      address: dto.address,
      status: Status.ACTIVE,
    });
    const patients = await this.patientRepository.find({
      where: { id: In(dto.patientIds) },
    });

    const family = this.familyMemberRepository.create({
      user,
      patients,
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
      where: { id },
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

    if (dto.patientIds && dto.patientIds.length > 0) {
      const patients = await this.patientRepository.find({
        where: { id: In(dto.patientIds) },
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
