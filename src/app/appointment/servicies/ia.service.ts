// src/app/ia/ia.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
const sharp = require('sharp');

@Injectable()
export class IaService {
  /**
   * Genera una máscara binaria (blanco/negro) desde la foto:
   * - Convierte a gris
   * - Normaliza contraste
   * - Calcula umbral ~ media del canal
   * - Aplica threshold -> salida pura B/N
   * - Heurística de inversión (para que el pie quede blanco)
   */
  async footMaskBinary(file: Express.Multer.File): Promise<Buffer> {
    if (!file?.buffer || file.size === 0) {
      throw new BadRequestException('Invalid or empty image file');
    }

    // 1) Normalización a escala de grises
    const gray = await sharp(file.buffer).greyscale().normalize().toBuffer();

    // 2) Estadísticas para elegir umbral
    const stats = await sharp(gray).stats();
    const mean = Math.round(stats.channels[0].mean); // 0..255
    const threshold = Math.min(255, Math.max(0, mean)); // umbral base

    // 3) Umbral binario (blanco/negro)
    let mask = await sharp(gray).threshold(threshold).png().toBuffer();

    // 4) Heurística: si el fondo resultó blanco:
    //    Calculamos ~proporción de blancos y, si > 60% es blanco, invertimos.
    const maskStats = await sharp(mask).stats();
    const whiteApprox =
      (maskStats.channels[0].sum / (255 * maskStats.channels[0].pixels)) * 100;
    if (whiteApprox > 60) {
      mask = await sharp(mask).negate().toBuffer();
    }

    // 5) Devuelve PNG binaria (L)
    return mask;
  }
}
