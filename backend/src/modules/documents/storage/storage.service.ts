import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { UploadedFileResult } from './storage.interface';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET') || 'documents';

    this.client = new S3Client({
      region: this.config.get<string>('S3_REGION') || 'us-east-1',
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') || '',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') || '',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadedFileResult> {
    const key = `${randomUUID()}-${file.originalname}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key,
      url: key,
    };
  }

  async getFileBuffer(path: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: path,
        }),
      );

      if (!response.Body) {
        throw new InternalServerErrorException(
          'No se pudo obtener el archivo del storage',
        );
      }

      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      return await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        stream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error leyendo archivo desde storage:', error);
      throw new InternalServerErrorException(
        'No se pudo leer el archivo desde el storage',
      );
    }
  }
}