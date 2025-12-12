import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import OpenAI from 'openai';

interface FootAnalysis {
  contactTotalPct: number;
  forefootPct: number;
  midfootPct: number;
  rearfootPct: number;

  forefootWidthMm?: number; // a
  isthmusWidthMm?: number; // b
  chippauxSmirakIndex?: number; // opcional, si ya lo calculas en la IA
  note?: string;
}

@Injectable()
export class IaService {
  /**
   * Genera una máscara binaria (blanco/negro) del pie.
   */

  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly MM_PER_PIXEL = 0.048;

  private pxToMm(px: number): number {
    return +(px * this.MM_PER_PIXEL).toFixed(2);
  }

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

  async computeLocalFromHeatmap(heatmapBuffer: Buffer): Promise<FootAnalysis> {
    const img = sharp(heatmapBuffer).toColourspace('b-w');
    const { data, info } = await img
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width: w, height: h, channels } = info;
    let pixels = data;
    let width = w;
    let height = h;

    // si viniera con más de 1 canal, lo normalizamos a 1 canal
    if (channels !== 1) {
      const again = await sharp(heatmapBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });
      pixels = again.data;
      width = again.info.width;
      height = again.info.height;
    }

    const yForeEnd = Math.floor(height * 0.35);
    const yMidEnd = Math.floor(height * 0.65);

    let sumFore = 0,
      sumMid = 0,
      sumRear = 0,
      countMask = 0,
      sumAll = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const g = pixels[idx]; // 0..255
        const p = 1 - g / 255; // presión 0..1
        if (p <= 0) continue; // fondo
        countMask++;
        sumAll += p;
        if (y < yForeEnd) sumFore += p;
        else if (y < yMidEnd) sumMid += p;
        else sumRear += p;
      }
    }

    if (countMask === 0 || sumAll === 0) {
      return {
        contactTotalPct: 0,
        forefootPct: 0,
        midfootPct: 0,
        rearfootPct: 0,
      };
    }

    const forePct = (sumFore / sumAll) * 100;
    const midPct = (sumMid / sumAll) * 100;
    const rearPct = (sumRear / sumAll) * 100;
    const contact = (sumAll / countMask) * 100;

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

  /**
   * IA: analiza el heatmap con GPT (imagen real) y devuelve:
   * - % de presión por región
   * - ancho antepié (a) e istmo (b) en píxeles
   * - índice de Chippaux-Smirak calculado en backend usando píxeles.
   */

  async analyzeFootPressure(heatmapBuffer: Buffer): Promise<FootAnalysis> {
    const base64 = heatmapBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    try {
      const resp = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Eres un analista de imágenes plantares. Devuelves SOLO un JSON plano con campos numéricos y un campo de texto corto (chippauxNote). Nada de texto fuera del JSON. No des diagnósticos ni recomendaciones de tratamiento.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  // Descripción específica de tu setup
                  'Analiza esta imagen plantar. Siempre contiene DOS pies humanos vistos desde la planta, apoyados sobre un vidrio, con la cámara mirando desde abajo.',
                  'La imagen puede estar en color o en escala de grises. Normalmente se ve la huella plantar como zonas claras/intensas (blanquecinas o brillantes) rodeadas por bordes más oscuros, y puede haber reflejos del cuerpo o del entorno en el fondo.',
                  'Aunque existan reflejos, ruido o variaciones de color, tu foco debe ser la forma de la planta de los pies y las áreas de contacto plantar.',
                  '',
                  'Tu tarea es:',
                  '- Identificar el patrón global de apoyo de ambos pies (antepié, mediopié y retropié).',
                  '- interpretar las zonas de mayor contacto/ presión a partir de las áreas más intensas o continuas de la huella.',
                  '',
                  'Devuelve un JSON con estos campos:',
                  '- contactTotalPct: número entre 0 y 100 que represente el porcentaje estimado de superficie plantar en contacto (global, ambos pies).',
                  '- forefootPct, midfootPct, rearfootPct: porcentajes que sumen aproximadamente 100 y describan cómo se distribuye la carga entre antepié, mediopié y retropié.',
                  '- forefootWidthPx: ancho máximo de la huella en el antepié (en píxeles, considerando el conjunto global de ambos pies / el pie más representativo).',
                  '- isthmusWidthPx: ancho mínimo de la huella en la región del istmo (mediopié) en píxeles.',
                  '- chippauxNote: La nota clínica debe incluir: (1) Descripción detallada del patrón de apoyo observando cómo se distribuyen las cargas entre antepié, mediopié y retropié y si existe predominio de alguna zona; (2) Interpretación geométrica basada en los anchos del antepié e istmo, explicando cómo esta relación se refleja en la continuidad o la reducción del contacto del mediopié; y (3) Una indicación descriptiva del tipo de pie en base al índice de Chippaux-Smirak, usando un tono descriptivo y sin emitir diagnósticos cerrados.',
                  '',
                  'MUY IMPORTANTE:',
                  '- Asume que la imagen corresponde a una huella plantar válida siempre que se aprecien claramente formas compatibles con la planta de uno o dos pies sobre el vidrio, aunque exista ruido, reflejos, rotaciones o contrastes extraños.',
                  "- NO clasifiques la imagen como 'sin huella plantar' solo porque veas dos pies, porque esté girada, porque esté binarizada, por cambios de color o por reflejos del cuerpo.",
                  "- Solo debes usar el caso especial de 'sin huella plantar' si realmente NO se observan formas compatibles con la planta de los pies (por ejemplo: solo texto, objetos no relacionados, un patrón completamente aleatorio o una imagen prácticamente vacía).",
                  '',
                  'CONDICIÓN ESPECIAL (CASO SIN HUELLA PLANTAR):',
                  'Si consideras que la imagen NO corresponde a una huella plantar válida (por ejemplo, es ruido puro, texto, otro objeto claramente distinto o no hay contacto plantar apreciable en absoluto), entonces debes responder EXACTAMENTE con estos valores:',
                  '- contactTotalPct = 0',
                  '- forefootPct = 0',
                  '- midfootPct = 0',
                  '- rearfootPct = 0',
                  '- forefootWidthPx = 0',
                  '- isthmusWidthPx = 0',
                  '- chippauxNote = "No se detecta huella plantar en la imagen analizada."',
                  '',
                  'Ejemplo de respuesta (no lo uses literal, solo el formato):',
                  '{ "contactTotalPct": 70.5, "forefootPct": 45, "midfootPct": 25, "rearfootPct": 30, "forefootWidthPx": 180, "isthmusWidthPx": 72, "chippauxNote": "Indica en qué rango se ubica el valor numérico y qué sugiere en términos morfológicos, usando un tono descriptivo y sin emitir diagnósticos cerrados." }',
                  '',
                  'No añadas comentarios fuera del JSON.',
                ].join('\n'),
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      });

      const raw = resp.choices?.[0]?.message?.content?.trim() ?? '{}';

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const clamp01 = (v: number) =>
        Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

      let fore = clamp01(Number(parsed.forefootPct));
      let mid = clamp01(Number(parsed.midfootPct));
      let rear = clamp01(Number(parsed.rearfootPct));
      let contact = clamp01(Number(parsed.contactTotalPct));

      const forefootWidthPx = Number(parsed.forefootWidthPx ?? 0);
      const isthmusWidthPx = Number(parsed.isthmusWidthPx ?? 0);

      const chippauxNoteFromIa =
        typeof parsed.chippauxNote === 'string'
          ? parsed.chippauxNote.trim()
          : undefined;

      // ---- Detectar explícitamente "no hay huella plantar" ----
      const isNoFootFromIa =
        contact === 0 &&
        fore === 0 &&
        mid === 0 &&
        rear === 0 &&
        forefootWidthPx === 0 &&
        isthmusWidthPx === 0 &&
        !!chippauxNoteFromIa &&
        /no se detecta huella plantar/i.test(chippauxNoteFromIa);

      if (isNoFootFromIa) {
        // Caso probado: imagen no es pie o no hay huella → devolver todo en 0
        return {
          contactTotalPct: 0,
          forefootPct: 0,
          midfootPct: 0,
          rearfootPct: 0,
          forefootWidthMm: undefined,
          isthmusWidthMm: undefined,
          chippauxSmirakIndex: undefined,
          note:
            chippauxNoteFromIa ||
            'No se detecta huella plantar en la imagen analizada.',
        };
      }

      // Si no hay datos válidos de presión → fallback local completo
      const sumRegions = fore + mid + rear;
      if (!Number.isFinite(sumRegions) || sumRegions === 0) {
        const local = await this.computeLocalFromHeatmap(heatmapBuffer);
        return local;
      }

      // Normalizar fore+mid+rear a 100
      if (sumRegions > 0) {
        const factor = 100 / sumRegions;
        fore = +(fore * factor).toFixed(2);
        mid = +(mid * factor).toFixed(2);
        rear = +(rear * factor).toFixed(2);
      }

      contact = +contact.toFixed(2);

      // ---- medición en píxeles → mm + índice Chippaux-Smirak ----
      let forefootWidthMm: number | undefined;
      let isthmusWidthMm: number | undefined;
      let chippauxSmirakIndex: number | undefined;

      if (
        Number.isFinite(forefootWidthPx) &&
        Number.isFinite(isthmusWidthPx) &&
        forefootWidthPx > 0 &&
        isthmusWidthPx > 0
      ) {
        // escalado físico
        forefootWidthMm = this.pxToMm(forefootWidthPx);
        isthmusWidthMm = this.pxToMm(isthmusWidthPx);

        // índice usando solo píxeles (dimensionalmente correcto)
        const index = isthmusWidthPx / forefootWidthPx; // b/a
        chippauxSmirakIndex = +(index * 100).toFixed(2); // %
      }

      return {
        contactTotalPct: contact,
        forefootPct: fore,
        midfootPct: mid,
        rearfootPct: rear,
        forefootWidthMm,
        isthmusWidthMm,
        chippauxSmirakIndex,
        note: chippauxNoteFromIa,
      };
    } catch (err) {
      // Error duro con la IA → mantenemos tu fallback local
      const local = await this.computeLocalFromHeatmap(heatmapBuffer);
      return local;
    }
  }
}
