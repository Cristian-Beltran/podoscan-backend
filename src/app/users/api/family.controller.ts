// src/app/user/controllers/family-member.controller.ts
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
import { CreateFamilyMemberDto } from '../dtos/family.dto';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';
import { FamilyMemberService } from '../services/family.service';
import { Status } from 'src/context/shared/models/active.model';

@UseGuards(JwtAuthGuard)
@Controller('family')
export class FamilyMemberController {
  constructor(private readonly familyMemberService: FamilyMemberService) {}

  @Post()
  create(@Body() dto: CreateFamilyMemberDto) {
    return this.familyMemberService.create(dto);
  }

  @Get()
  findAll() {
    return this.familyMemberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.familyMemberService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: Partial<CreateFamilyMemberDto>,
  ) {
    return this.familyMemberService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.familyMemberService.remove(id);
  }
  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: { status: Status },
  ) {
    return this.familyMemberService.updateStatus(id, dto.status);
  }
}
