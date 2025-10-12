// src/app/user/services/user-base.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserBaseDto } from '../dtos/user.dto';
import { Status } from 'src/context/shared/models/active.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserBaseService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(dto: CreateUserBaseDto): Promise<User> {
    const userRepeatEmail = await this.findByEmail(dto.email);
    if (userRepeatEmail) throw new BadRequestException('Email already exists');
    const user = this.userRepository.create(dto);
    console.log(user.address);
    const passwordHash = await bcrypt.hash(dto.password.replace(/-/g, ''), 10);
    user.password = passwordHash;
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, status: Not(Status.DELETED) },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async updateUser(id: string, dto: Partial<CreateUserBaseDto>): Promise<User> {
    const userRepeatEmail = await this.findByEmail(dto.email);
    if (userRepeatEmail && userRepeatEmail.id !== id)
      throw new BadRequestException('Email already exists');
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async removeUser(id: string): Promise<void> {
    const user = await this.findById(id);
    user.status = Status.DELETED;
    await this.userRepository.save(user);
  }

  async updateStatus(id: string, status: Status): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.userRepository.save(user);
  }
}
