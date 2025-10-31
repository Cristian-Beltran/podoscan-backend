// src/app/session/controllers/session.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/context/shared/guards/jwt-auth.guard';
import { SessionService } from '../services/session.service';
import { IngestSessionDto } from '../dtos/session-data.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly service: SessionService) {}

  /**
   * Ingesta de 1 muestra desde el ESP32 (create-or-append a la sesión del día).
   */
  @Post('ingest')
  ingest(@Body() dto: IngestSessionDto) {
    return this.service.ingest(dto);
  }

  /**
   * Listar TODAS las sesiones de un paciente con TODOS sus datos (sin paginar).
   */
  @Get('patient/:patientId')
  listAllByPatient(@Param('patientId', new ParseUUIDPipe()) patientId: string) {
    return this.service.listAllByPatient(patientId);
  }
}
