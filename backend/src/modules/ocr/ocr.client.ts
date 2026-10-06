import { BadGatewayException, GatewayTimeoutException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OcrClientService {
  private readonly logger = new Logger(OcrClientService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (config.get<string>('ocr.baseUrl') || '').replace(/\/$/, '');
    this.timeoutMs = config.get<number>('ocr.timeoutMs') || 120000;
    if (!this.baseUrl) throw new Error('OCR_SERVICE_URL no está configurada.');
  }

  async processFile(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();
    try {
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), fileName);
      this.logger.log(`OCR request ${requestId} started file=${fileName} bytes=${fileBuffer.length}`);
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST', body: formData, signal: controller.signal,
        headers: { 'x-request-id': requestId, 'x-ocr-api-key': this.config.get<string>('OCR_INTERNAL_API_KEY') || '' },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new BadGatewayException(payload?.detail || `El microservicio OCR respondió HTTP ${response.status}.`);
      }
      this.logger.log(`OCR request ${requestId} completed durationMs=${Date.now() - startedAt}`);
      return payload;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        this.logger.error(`OCR request ${requestId} timeout after ${this.timeoutMs}ms`);
        throw new GatewayTimeoutException(`El procesamiento OCR excedió ${this.timeoutMs} ms.`);
      }
      this.logger.error(`OCR request ${requestId} failed: ${error?.message || error}`);
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException('No se pudo conectar con el microservicio OCR.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
