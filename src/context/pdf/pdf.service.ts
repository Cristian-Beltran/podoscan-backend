import { Injectable } from '@nestjs/common';
import * as PdfPrinter from 'pdfmake/src/printer';
import * as path from 'path';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

interface PdfMetaInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
}

@Injectable()
export class PdfService {
  private readonly fonts: TFontDictionary = {
    Roboto: {
      normal: path.resolve(__dirname, '../../assets/fonts/Roboto-Regular.ttf'),
      bold: path.resolve(__dirname, '../../assets/fonts/Roboto-Bold.ttf'),
      italics: path.resolve(__dirname, '../../assets/fonts/Roboto-Italic.ttf'),
      bolditalics: path.resolve(
        __dirname,
        '../../assets/fonts/Roboto-BoldItalic.ttf',
      ),
    },
  };

  async generatePdf(
    getDefinition: () => TDocumentDefinitions,
    meta?: PdfMetaInfo,
  ): Promise<Buffer> {
    const docDefinition = getDefinition();
    const printer = new PdfPrinter(this.fonts);
    if (meta) {
      docDefinition.info = {
        ...meta,
      };
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }
}
