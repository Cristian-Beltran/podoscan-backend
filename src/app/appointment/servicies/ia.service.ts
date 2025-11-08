import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import OpenAI from 'openai';

type PressureJSON = {
  contactTotalPct: number;
  forefootPct: number;
  midfootPct: number;
  rearfootPct: number;
};
@Injectable()
export class IaService {
  /**
   * Genera una máscara binaria (blanco/negro) del pie.
   */

  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async footMaskBinary(file: Express.Multer.File): Promise<Buffer> {
    if (!file?.buffer || file.size === 0) {
      throw new BadRequestException('Invalid or empty image file');
    }

    const gray = await sharp(file.buffer).greyscale().toBuffer();
    const stats = await sharp(gray).stats();
    const mean = Math.round(stats.channels[0].mean); // 0..255
    const threshold = Math.min(255, Math.max(0, mean));

    let mask = await sharp(gray).threshold(threshold).png().toBuffer();

    // ¿Fondo blanco? Invertimos para garantizar pie=blanco
    const mstats = await sharp(mask).stats();
    const whitePct = (mstats.channels[0].mean / 255) * 100;
    if (whitePct > 60) {
      mask = await sharp(mask).negate().toBuffer();
    }
    return mask; // PNG, 1 canal
  }

  /**
   * Mapa de presión en escala de grises + contorno:
   * - NO cambia dimensiones
   * - Dentro de la máscara:
   *    · aumenta contraste (gamma + linear) y luego invierte:
   *      ⇒ más presión ⇒ más oscuro
   * - Contorno blanco (laplaciano + threshold) superpuesto sin artefactos
   */
  async footPressureMap(file: Express.Multer.File): Promise<Buffer> {
    if (!file?.buffer || file.size === 0) {
      throw new BadRequestException('Invalid or empty image file');
    }

    // 1) Base en gris (sin resize)
    const gray = await sharp(file.buffer).greyscale().toBuffer();

    // 2) Máscara (pie blanco, fondo negro)
    const mask = await this.footMaskBinary(file);

    // 3) Aísla solo el pie (limpia fondo) usando la máscara
    const masked = await sharp(gray)
      .composite([{ input: mask, blend: 'dest-in' }])
      .toBuffer();

    // 4) Aumenta contraste dentro del pie y luego invierte (alto → oscuro)
    //    - blur suave para quitar ruido fino
    //    - gamma > 1 oscurece medios tonos (mejor separación)
    //    - linear(1.15, -10) sube un poco el contraste y baja leve el piso
    //    - negate() invierte: alto → oscuro
    const body = await sharp(masked)
      .blur(0.7)
      .gamma(1.5) // [1.0–3.0], leve
      .linear(1.35, -20) // ajuste fino de contraste global
      .negate() // ahora: más presión = más oscuro
      .toBuffer();

    // 5) Contorno blanco SIN líneas:
    //    - Aplica laplaciano a la versión suavizada del pie
    //    - Threshold para líneas 1px limpias
    const edges = await sharp(masked)
      .blur(0.6)
      .convolve({
        width: 3,
        height: 3,
        kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0],
      })
      .threshold(40) // sube/baja 30–60 para más/menos borde
      .toBuffer();

    // 6) Superpone el contorno blanco sobre el mapa
    //    - 'lighten' evita banding/artefactos y no quema la base
    const combined = await sharp(body)
      .composite([{ input: edges, blend: 'lighten' }])
      .toColourspace('b-w') // salida estrictamente en grises
      .png()
      .toBuffer();

    return combined;
  }
  /**
   * Analiza la imagen térmica con GPT-4-mini para obtener porcentajes aproximados.
   */

  async computeLocalFromHeatmap(heatmapBuffer: Buffer): Promise<PressureJSON> {
    const img = sharp(heatmapBuffer).toColourspace('b-w');
    const { data, info } = await img
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels } = info;
    if (channels !== 1) {
      // garantizar 1 canal
      const again = await sharp(heatmapBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      return this.computeLocalFromHeatmap(again.data);
    }

    // Particiones (0=top => antepié, h-1=bottom => retropié)
    const yForeEnd = Math.floor(h * 0.35); // parte “delantera”
    const yMidEnd = Math.floor(h * 0.65); // medio
    // rear = yMidEnd..h-1

    let sumFore = 0,
      sumMid = 0,
      sumRear = 0,
      countMask = 0,
      sumAll = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const g = data[idx]; // 0..255 (oscuro = más presión)
        const p = 1 - g / 255; // presión 0..1
        if (p <= 0) continue; // fondo negro puro (sin pie) no aporta
        countMask++;
        sumAll += p;
        if (y < yForeEnd) sumFore += p;
        else if (y < yMidEnd) sumMid += p;
        else sumRear += p;
      }
    }

    if (countMask === 0 || sumAll === 0) {
      // sin pie o mapa vacío
      return {
        contactTotalPct: 0,
        forefootPct: 0,
        midfootPct: 0,
        rearfootPct: 0,
      };
    }

    // Distribución relativa (suma 100)
    const forePct = (sumFore / sumAll) * 100;
    const midPct = (sumMid / sumAll) * 100;
    const rearPct = (sumRear / sumAll) * 100;

    // “contacto total” como intensidad media global (0..100)
    const contact = (sumAll / countMask) * 100;

    // clamp + redondeo
    const clamp = (v: number) => Math.max(0, Math.min(100, +v.toFixed(2)));
    return {
      contactTotalPct: clamp(contact),
      forefootPct: clamp(forePct),
      midfootPct: clamp(midPct),
      rearfootPct: clamp(rearPct),
    };
  }

  /**
   * IA: analiza el heatmap usando GPT con entrada de imagen REAL (input_image).
   * Fuerza salida JSON. Si falla o devuelve ceros ⇒ fallback local.
   */
  async analyzeFootPressure(heatmapBuffer: Buffer): Promise<PressureJSON> {
    // Data URL para input_image
    const base64 = heatmapBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    try {
      const resp = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        // fuerza JSON “plano”
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un analista de imágenes plantares. Responde ÚNICAMENTE un JSON plano con cuatro campos numéricos.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  'Analiza esta imagen plantar (mapa en grises: más presión = más oscuro) y devuelve un JSON con % aproximados.' +
                  ' Campos: contactTotalPct, forefootPct, midfootPct, rearfootPct. Suma fore+mid+rear ≈ 100.' +
                  ' No incluyas texto adicional.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      });

      const raw = resp.choices?.[0]?.message?.content?.trim() || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        // el modelo no respetó el formato; usamos fallback
        return await this.computeLocalFromHeatmap(heatmapBuffer);
      }

      // saneo + clamps + normalización suave
      let fore = Number(parsed.forefootPct ?? 0);
      let mid = Number(parsed.midfootPct ?? 0);
      let rear = Number(parsed.rearfootPct ?? 0);
      let contact = Number(parsed.contactTotalPct ?? 0);

      const clamp01 = (v: number) => Math.max(0, Math.min(100, v));
      fore = clamp01(fore);
      mid = clamp01(mid);
      rear = clamp01(rear);
      contact = clamp01(contact);

      // si todo es 0 o NaN ⇒ fallback local
      if (fore + mid + rear === 0) {
        return await this.computeLocalFromHeatmap(heatmapBuffer);
      }

      // Normaliza fore+mid+rear a 100 manteniendo proporción
      const sum = fore + mid + rear;
      if (sum > 0) {
        fore = +(fore * (100 / sum)).toFixed(2);
        mid = +(mid * (100 / sum)).toFixed(2);
        rear = +(rear * (100 / sum)).toFixed(2);
      }

      return {
        contactTotalPct: +contact.toFixed(2),
        forefootPct: fore,
        midfootPct: mid,
        rearfootPct: rear,
      };
    } catch (err) {
      // red de IA caída / timeout ⇒ fallback local
      return await this.computeLocalFromHeatmap(heatmapBuffer);
    }
  }
}
