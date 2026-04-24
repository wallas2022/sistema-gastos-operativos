import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class OcrClientService {
  async processFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });

      formData.append('file', blob, fileName);

      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new InternalServerErrorException(
          `OCR service error: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error conectando con microservicio OCR:', error);
      throw new InternalServerErrorException(
        'No se pudo procesar el documento en el microservicio OCR',
      );
    }
  }
}