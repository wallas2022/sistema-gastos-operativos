import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { DocumentStatus } from '@prisma/client';
import { ListDocumentsDto } from './dto/list-documents.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    const uploaded = await this.storageService.uploadFile(file);

    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop() || '',
        mimeType: file.mimetype,
        storagePath: uploaded.key,
        sizeBytes: BigInt(file.size),
        status: DocumentStatus.CARGADO,
        userId,
      },
    });

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
    };
  }

  async findAll(_query?: ListDocumentsDto) {
    const documents = await this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ocrResult: true,
        confirmation: true,
      },
    });

    return documents.map((document) => ({
      ...document,
      sizeBytes: Number(document.sizeBytes),
    }));
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        ocrResult: true,
        confirmation: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    return {
      ...document,
      sizeBytes: Number(document.sizeBytes),
    };
  }

 async getFileStream(documentId: string) {
  const document = await this.prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return null;
  }

  const buffer = await this.storageService.getFileBuffer(document.storagePath);

  return {
    buffer,
    mimeType: document.mimeType,
    fileName: document.fileName,
  };
}


}